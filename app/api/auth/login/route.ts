import { NextResponse } from "next/server";
import { loginUser } from "@/server/auth/auth.service";
import { cookies } from "next/headers";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "").trim();

    if (!email || !password) {
      return NextResponse.json(
        {
          success: false,
          message: "email and password are required",
        },
        { status: 400 }
      );
    }

    const result = await loginUser(email, password);

    const cookieStore = await cookies();

    cookieStore.set("session_token", result.sessionToken, {
      httpOnly: true,
      secure: false, // потом поменяем на true в проде
      sameSite: "lax",
      path: "/",
    });

    return NextResponse.json({
      success: true,
      message: "Login successful",
    });
  } catch (error) {
    console.error("Login error:", error);

    const message =
      error instanceof Error ? error.message : "Login failed";

    return NextResponse.json(
      {
        success: false,
        message,
      },
      { status: 401 }
    );
  }
}