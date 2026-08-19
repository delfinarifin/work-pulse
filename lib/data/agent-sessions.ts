import type { SupabaseClient } from "@supabase/supabase-js";
import type { Device } from "@/lib/types";
import { classifySession } from "@/lib/classification/classifySession";
import { runSessionAggregationForConsultantDate } from "@/lib/data/timesheets";

const DEFAULT_IDLE_THRESHOLD_MINUTES = 5;

export type HeartbeatPayload = {
  applicationName: string | null;
  windowTitle: string | null;
  fileName: string | null;
  filePath: string | null;
  isIdle: boolean;
};

type SessionRow = {
  id: string;
  started_at: string;
  application_name: string | null;
  window_title: string | null;
  file_name: string | null;
  file_path: string | null;
  active_duration_minutes: number;
  idle_duration_minutes: number;
};

function sameIdentity(session: SessionRow, payload: HeartbeatPayload): boolean {
  return (
    (session.application_name ?? "") === (payload.applicationName ?? "") &&
    (session.window_title ?? "") === (payload.windowTitle ?? "") &&
    (session.file_name ?? "") === (payload.fileName ?? "") &&
    (session.file_path ?? "") === (payload.filePath ?? "")
  );
}

function minutesBetween(a: Date, b: Date): number {
  return Math.max(0, Math.round((b.getTime() - a.getTime()) / 60000));
}

// The whole heartbeat pipeline: recomputes active_duration_minutes on
// every call rather than incrementally adding a client-reported delta —
// self-correcting against missed/delayed heartbeats, since it's always
// "elapsed wall-clock time since started_at, minus accumulated idle,
// as of now" rather than a running sum that can drift. A session that
// stops receiving heartbeats (agent closed, machine slept) simply stops
// being updated — it does NOT keep growing in the background, since
// nothing here runs on a timer.
export async function recordHeartbeat(
  service: SupabaseClient,
  device: Device,
  payload: HeartbeatPayload,
): Promise<void> {
  const now = new Date();
  const consultantId = device.consultant_id;

  const { data: settings } = await service
    .from("classification_settings")
    .select("idle_threshold_minutes")
    .eq("consultant_id", consultantId)
    .maybeSingle();
  const idleThresholdMinutes = settings?.idle_threshold_minutes ?? DEFAULT_IDLE_THRESHOLD_MINUTES;

  const { data: activeSession } = await service
    .from("activity_sessions")
    .select(
      "id, started_at, application_name, window_title, file_name, file_path, active_duration_minutes, idle_duration_minutes",
    )
    .eq("device_id", device.id)
    .eq("status", "active")
    .maybeSingle<SessionRow>();

  const openIdlePeriod = activeSession
    ? (
        await service
          .from("idle_periods")
          .select("id, started_at")
          .eq("session_id", activeSession.id)
          .is("ended_at", null)
          .maybeSingle<{ id: string; started_at: string }>()
      ).data
    : null;

  let userId: string | null = null;
  {
    const { data: consultantRow } = await service
      .from("consultants")
      .select("user_id")
      .eq("id", consultantId)
      .maybeSingle();
    userId = consultantRow?.user_id ?? null;
  }

  async function closeSession(session: SessionRow, endAt: Date) {
    const activeMinutes = Math.max(
      0,
      minutesBetween(new Date(session.started_at), endAt) - session.idle_duration_minutes,
    );
    await service
      .from("activity_sessions")
      .update({ ended_at: endAt.toISOString(), status: "closed", active_duration_minutes: activeMinutes })
      .eq("id", session.id);
    await runSessionAggregationForConsultantDate(
      consultantId,
      session.started_at.slice(0, 10),
      service,
      userId,
    );
  }

  if (payload.isIdle) {
    if (activeSession) {
      if (!openIdlePeriod) {
        await service.from("idle_periods").insert({
          session_id: activeSession.id,
          device_id: device.id,
          started_at: now.toISOString(),
          reason: "no_input",
          user_id: userId,
        });
      } else {
        const idleMinutesSoFar = minutesBetween(new Date(openIdlePeriod.started_at), now);
        if (idleMinutesSoFar >= idleThresholdMinutes) {
          const idleStart = new Date(openIdlePeriod.started_at);
          await closeSession(activeSession, idleStart);
          await service
            .from("idle_periods")
            .update({ ended_at: now.toISOString(), duration_minutes: idleMinutesSoFar })
            .eq("id", openIdlePeriod.id);
        }
      }
    }
  } else {
    let idleDurationAdd = 0;
    if (openIdlePeriod) {
      idleDurationAdd = minutesBetween(new Date(openIdlePeriod.started_at), now);
      await service
        .from("idle_periods")
        .update({ ended_at: now.toISOString(), duration_minutes: idleDurationAdd })
        .eq("id", openIdlePeriod.id);
    }

    if (activeSession && idleDurationAdd > 0) {
      activeSession.idle_duration_minutes += idleDurationAdd;
      await service
        .from("activity_sessions")
        .update({ idle_duration_minutes: activeSession.idle_duration_minutes })
        .eq("id", activeSession.id);
    }

    if (activeSession && sameIdentity(activeSession, payload)) {
      const activeMinutes = Math.max(
        0,
        minutesBetween(new Date(activeSession.started_at), now) - activeSession.idle_duration_minutes,
      );
      await service
        .from("activity_sessions")
        .update({ ended_at: now.toISOString(), active_duration_minutes: activeMinutes })
        .eq("id", activeSession.id);
    } else {
      if (activeSession) {
        await closeSession(activeSession, now);
      }

      const classification = await classifySession(service, {
        consultantId,
        fileName: payload.fileName,
        filePath: payload.filePath,
        applicationName: payload.applicationName,
        windowTitle: payload.windowTitle,
      });

      await service.from("activity_sessions").insert({
        consultant_id: consultantId,
        device_id: device.id,
        client_id: classification.clientId,
        service_id: classification.serviceId,
        task_id: classification.taskId,
        work_type_id: classification.workTypeId,
        application_name: payload.applicationName,
        window_title: payload.windowTitle,
        file_name: payload.fileName,
        file_path: payload.filePath,
        started_at: now.toISOString(),
        ended_at: now.toISOString(),
        active_duration_minutes: 0,
        idle_duration_minutes: 0,
        status: "active",
        billable_status: classification.billableStatus,
        classification_method: classification.clientMethod ?? classification.serviceMethod ?? null,
        classification_confidence: classification.overallConfidence,
        review_status: classification.needsConfirmation ? "unreviewed" : "confirmed",
        source: "agent",
        user_id: userId,
      });
    }
  }

  await service.from("devices").update({ last_seen_at: now.toISOString() }).eq("id", device.id);
}
