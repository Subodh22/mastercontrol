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
    <main className="mx-auto max-w-md space-y-4">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Sign in</h2>
        <p className="mt-1 text-sm text-zinc-600">Use Google to access your vault.</p>
      </div>

      <div className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
        <div className="space-y-3">
          <button
            onClick={signInWithGoogle}
            disabled={status.type === "loading"}
            className="w-full rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-zinc-800 disabled:opacity-50"
          >
            Continue with Google
          </button>

          <details className="rounded-md border border-zinc-200 bg-zinc-50 p-3">
            <summary className="cursor-pointer text-sm text-zinc-700">Use email magic link instead</summary>
            <form className="mt-3 space-y-3" onSubmit={onSubmit}>
              <label className="block text-sm font-medium text-zinc-800">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@domain.com"
                className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />

              <button
                disabled={status.type === "loading"}
                className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-700 shadow-sm hover:bg-zinc-50 disabled:opacity-50"
              >
                {status.type === "loading" ? "Sending…" : "Send magic link"}
              </button>

              {status.type === "sent" && <p className="text-sm text-emerald-600">Check your email for the sign-in link.</p>}
            </form>
          </details>

          {status.type === "error" && <p className="text-sm text-red-600">{status.message}</p>}
        </div>
      </div>

      <div className="text-xs text-zinc-500">Only authenticated users can access conversations.</div>
    </main>
  );
}
