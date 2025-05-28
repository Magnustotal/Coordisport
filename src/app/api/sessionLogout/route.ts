import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const response = NextResponse.json({ success: true });

  response.cookies.set("__session", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: new Date(0),
    maxAge: 0,
    sameSite: "strict",
  });

  return response;
}
