import { NextResponse } from "next/server";
import { loginUser } from "@/server/auth/auth.service";

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

    return NextResponse.json({
      success: true,
      message: "Login successful",
      data: result,
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