import type { Metadata } from "next";
import "./globals.css";

const appName = process.env.NEXT_PUBLIC_APP_NAME ?? "MasterControl";

export const metadata: Metadata = {
  title: appName,
  description: "Personal conversation vault",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-dvh bg-zinc-950 text-zinc-50">
        <div className="mx-auto max-w-4xl px-4 py-10">
          <header className="mb-10">
            <h1 className="text-2xl font-semibold tracking-tight">{appName}</h1>
            <p className="mt-1 text-sm text-zinc-400">Vault. Search. Control.</p>
          </header>
          {children}
        </div>
      </body>
    </html>
  );
}
