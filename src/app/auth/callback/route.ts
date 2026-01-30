import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) return NextResponse.redirect(new URL("/login", requestUrl.origin));

  if (code) {
    const response = NextResponse.redirect(new URL("/conversations", requestUrl.origin));

    const supabase = createServerClient(url, anon, {
      cookies: {
        getAll: () => [],
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    });

    await supabase.auth.exchangeCodeForSession(code);

    return response;
  }

  return NextResponse.redirect(new URL("/login", requestUrl.origin));
}
