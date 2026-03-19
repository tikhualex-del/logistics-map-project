import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getCurrentUserBySessionToken } from "@/server/auth/auth.service";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("session_token")?.value;

    if (!sessionToken) {
      return NextResponse.json(
        {
          success: false,
          message: "Not authenticated",
        },
        { status: 401 }
      );
    }

    const result = await getCurrentUserBySessionToken(sessionToken);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Get current user error:", error);

    const message =
      error instanceof Error ? error.message : "Failed to get current user";

    return NextResponse.json(
      {
        success: false,
        message,
      },
      { status: 401 }
    );
  }
}