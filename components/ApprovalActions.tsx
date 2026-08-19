"use client";

import { useRef } from "react";
import {
  approveSubmissionAction,
  rejectSubmissionAction,
  reopenSubmissionAction,
} from "@/app/approvals/actions";

export function ApproveRejectControls({ submissionId }: { submissionId: string }) {
  const reasonRef = useRef<HTMLInputElement>(null);

  return (
    <div className="flex items-center gap-2">
      <form action={approveSubmissionAction}>
        <input type="hidden" name="id" value={submissionId} />
        <button
          type="submit"
          className="rounded border border-green-300 bg-green-50 px-2 py-1 text-xs font-medium text-green-700 hover:bg-green-100"
        >
          Approve
        </button>
      </form>
      <form
        action={rejectSubmissionAction}
        onSubmit={(e) => {
          const reason = window.prompt("Reason for rejecting this timesheet?");
          if (!reason) {
            e.preventDefault();
            return;
          }
          if (reasonRef.current) reasonRef.current.value = reason;
        }}
      >
        <input type="hidden" name="id" value={submissionId} />
        <input ref={reasonRef} type="hidden" name="reason" />
        <button
          type="submit"
          className="rounded border border-red-300 bg-red-50 px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-100"
        >
          Reject
        </button>
      </form>
    </div>
  );
}

export function ReopenControl({ submissionId }: { submissionId: string }) {
  const reasonRef = useRef<HTMLInputElement>(null);

  return (
    <form
      action={reopenSubmissionAction}
      onSubmit={(e) => {
        const reason = window.prompt("Reason for reopening this timesheet?");
        if (!reason) {
          e.preventDefault();
          return;
        }
        if (reasonRef.current) reasonRef.current.value = reason;
      }}
    >
      <input type="hidden" name="id" value={submissionId} />
      <input ref={reasonRef} type="hidden" name="reason" />
      <button
        type="submit"
        className="rounded border border-neutral-300 px-2 py-1 text-xs font-medium hover:bg-neutral-50"
      >
        Reopen
      </button>
    </form>
  );
}
