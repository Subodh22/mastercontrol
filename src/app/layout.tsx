import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

const appName = process.env.NEXT_PUBLIC_APP_NAME ?? "MasterControl";

export const metadata: Metadata = {
  title: appName,
  description: "Personal conversation vault",
};

function Sidebar() {
  return (
    <aside className="hidden w-64 shrink-0 border-r border-zinc-200 bg-zinc-50 p-4 md:block">
      <div className="px-2 py-2">
        <div className="text-sm font-semibold text-zinc-900">{appName}</div>
        <div className="mt-1 text-xs text-zinc-500">Vault. Search. Control.</div>
      </div>

      <nav className="mt-6 space-y-1 text-sm">
        <Link
          href="/conversations"
          className="block rounded-md px-2 py-2 text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900"
        >
          Conversations
        </Link>
        <Link
          href="/conversations/new"
          className="block rounded-md px-2 py-2 text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900"
        >
          Import
        </Link>
        <Link
          href="/passions"
          className="block rounded-md px-2 py-2 text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900"
        >
          Passions
        </Link>
        <Link
          href="/tasks"
          className="block rounded-md px-2 py-2 text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900"
        >
          Ops Board
        </Link>
        <Link
          href="/usage"
          className="block rounded-md px-2 py-2 text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900"
        >
          Usage
        </Link>
        <Link
          href="/conversations?q="
          className="block rounded-md px-2 py-2 text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900"
        >
          Search
        </Link>
      </nav>

      <div className="mt-8 rounded-md border border-zinc-200 bg-white p-3 text-xs text-zinc-600">
        Tip: Use short titles like “Dental offer – Jan 30”.
      </div>
    </aside>
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-dvh bg-zinc-100 text-zinc-900">
        <div className="flex min-h-dvh">
          <Sidebar />
          <div className="flex-1">
            <div className="mx-auto max-w-5xl px-4 py-8 md:px-8">
              <div className="mb-8 md:hidden">
                <div className="text-xl font-semibold tracking-tight">{appName}</div>
                <div className="mt-1 text-sm text-zinc-600">Vault. Search. Control.</div>
                <div className="mt-4 flex gap-2 text-sm">
                  <Link className="rounded-md bg-white px-3 py-2 text-zinc-800 shadow-sm" href="/conversations">
                    Conversations
                  </Link>
                  <Link className="rounded-md bg-white px-3 py-2 text-zinc-800 shadow-sm" href="/conversations/new">
                    Import
                  </Link>
                </div>
              </div>
              {children}
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
