import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";

export async function GET() {
  const user = await getUser();

  if (!user) {
    const response = NextResponse.json({ user: null });
    response.headers.set("Cache-Control", "private, max-age=300");
    return response;
  }

  const response = NextResponse.json({
    user: {
      email: user.email ?? null,
      name: (user.user_metadata?.full_name as string) ?? null,
    },
  });
  response.headers.set("Cache-Control", "private, max-age=300");
  return response;
}
