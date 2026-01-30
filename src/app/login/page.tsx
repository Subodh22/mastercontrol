"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/browser";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<{ type: "idle" | "loading" | "sent" | "error"; message?: string }>({
    type: "idle",
  });

  async function signInWithGoogle() {
    setStatus({ type: "loading" });
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
    } catch (err: any) {
      setStatus({ type: "error", message: err?.message ?? "Failed to sign in with Google" });
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus({ type: "loading" });

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
      setStatus({ type: "sent" });
    } catch (err: any) {
      setStatus({ type: "error", message: err?.message ?? "Failed to send magic link" });
    }
  }

  return (
    <main className="space-y-6">
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-6">
        <h2 className="text-lg font-semibold">Sign in</h2>
        <p className="mt-1 text-sm text-zinc-400">Use Google (recommended) or email magic link.</p>

        <div className="mt-6 space-y-3">
          <button
            onClick={signInWithGoogle}
            disabled={status.type === "loading"}
            className="w-full rounded-md bg-zinc-50 px-3 py-2 text-sm font-medium text-zinc-950 disabled:opacity-50"
          >
            Continue with Google
          </button>

          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-zinc-800" />
            <div className="text-xs text-zinc-500">or</div>
            <div className="h-px flex-1 bg-zinc-800" />
          </div>

          <form className="space-y-3" onSubmit={onSubmit}>
            <label className="block text-sm text-zinc-300">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@domain.com"
              className="w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-zinc-50 placeholder:text-zinc-600"
            />

            <button
              disabled={status.type === "loading"}
              className="w-full rounded-md border border-zinc-800 bg-zinc-900/40 px-3 py-2 text-sm font-medium text-zinc-200 hover:bg-zinc-900 disabled:opacity-50"
            >
              {status.type === "loading" ? "Sending…" : "Send magic link"}
            </button>

            {status.type === "sent" && (
              <p className="text-sm text-emerald-400">Check your email for the sign-in link.</p>
            )}
            {status.type === "error" && <p className="text-sm text-red-400">{status.message}</p>}
          </form>
        </div>
      </div>

      <div className="text-xs text-zinc-500">
        Security note: anyone with your app URL can see the login screen, but only authenticated users can access
        conversations.
      </div>
    </main>
  );
}
