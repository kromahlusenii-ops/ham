import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const origin = new URL(request.url).origin;
  const response = NextResponse.redirect(`${origin}/`, { status: 303 });

  response.cookies.set("dev-auth", "", {
    path: "/",
    httpOnly: true,
    maxAge: 0,
  });

  return response;
}
