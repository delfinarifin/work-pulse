"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signIn, type AuthState } from "@/app/login/actions";

const initialState: AuthState = { error: null };

export default function LoginForm() {
  const [state, formAction, pending] = useActionState(signIn, initialState);

  return (
    <form action={formAction} className="w-full max-w-sm space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Sign in</h1>
        <p className="text-sm text-neutral-500">
          Access your Work Pulse timesheets.
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
          className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-md bg-neutral-900 text-white px-4 py-2 text-sm font-medium disabled:opacity-50"
      >
        {pending ? "Signing in…" : "Sign in"}
      </button>

      <p className="text-sm text-neutral-500 text-center">
        No account?{" "}
        <Link href="/signup" className="font-medium text-neutral-900 underline underline-offset-4">
          Sign up
        </Link>
      </p>
    </form>
  );
}
