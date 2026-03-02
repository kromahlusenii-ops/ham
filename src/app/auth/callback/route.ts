import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Handle Vercel proxy — use x-forwarded-host if present
      const forwardedHost = request.headers.get("x-forwarded-host");
      const isLocalhost = forwardedHost?.startsWith("localhost");
      const origin = forwardedHost
        ? `${isLocalhost ? "http" : "https"}://${forwardedHost}`
        : new URL(request.url).origin;

      const response = NextResponse.redirect(`${origin}${next}`);

      // Persist the GitHub provider token as an httpOnly cookie
      const ghToken = data.session?.provider_token;
      if (ghToken) {
        response.cookies.set("gh-token", ghToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          path: "/",
          maxAge: 60 * 60 * 24 * 30, // 30 days
        });
      }

      return response;
    }
  }

  // Auth failed — redirect to login with error
  const origin = new URL(request.url).origin;
  return NextResponse.redirect(
    `${origin}/login?error=auth_callback_failed`,
  );
}
