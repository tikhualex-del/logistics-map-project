import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { logoutUserBySessionToken } from "@/server/auth/auth.service";

export async function POST() {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("session_token")?.value;

    if (sessionToken) {
      await logoutUserBySessionToken(sessionToken);
    }

    cookieStore.set("session_token", "", {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      path: "/",
      expires: new Date(0),
    });

    return NextResponse.json({
      success: true,
      message: "Logout successful",
    });
  } catch (error) {
    console.error("Logout error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Logout failed",
      },
      { status: 500 }
    );
  }
}