"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signUp, type AuthState } from "@/app/login/actions";

const initialState: AuthState = { error: null };

export default function SignupForm() {
  const [state, formAction, pending] = useActionState(signUp, initialState);

  if (state.message) {
    return (
      <div className="w-full max-w-sm space-y-4">
        <h1 className="text-2xl font-bold tracking-tight">Almost there</h1>
        <p className="text-sm text-neutral-600">{state.message}</p>
        <Link
          href="/login"
          className="inline-block rounded-md bg-neutral-900 text-white px-4 py-2 text-sm font-medium"
        >
          Go to sign in
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="w-full max-w-sm space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Create your account</h1>
        <p className="text-sm text-neutral-500">
          Get your own private Work Pulse timesheet.
        </p>
      </div>

      {state.error && (
        <p
          role="alert"
          className="rounded-md bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2"
        >
          {state.error}
        </p>
      )}

      <div className="space-y-1">
        <label htmlFor="name" className="text-sm font-medium">
          Name
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="job_role" className="text-sm font-medium">
          Job role
        </label>
        <input
          id="job_role"
          name="job_role"
          type="text"
          required
          placeholder="Tax Senior, Accounting Associate, …"
          className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="email" className="text-sm font-medium">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="password" className="text-sm font-medium">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          minLength={6}
          className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-md bg-neutral-900 text-white px-4 py-2 text-sm font-medium disabled:opacity-50"
      >
        {pending ? "Creating account…" : "Sign up"}
      </button>

      <p className="text-sm text-neutral-500 text-center">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-neutral-900 underline underline-offset-4">
          Sign in
        </Link>
      </p>
    </form>
  );
}
