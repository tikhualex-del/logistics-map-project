import { NextResponse } from "next/server";
import { createOwnerBundle } from "@/server/auth/auth.service";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const companyName = String(body.companyName || "").trim();
    const fullName = String(body.fullName || "").trim();
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "").trim();

    if (!companyName || !fullName || !email || !password) {
      return NextResponse.json(
        {
          success: false,
          message: "companyName, fullName, email and password are required",
        },
        { status: 400 }
      );
    }

    const result = await createOwnerBundle({
      companyName,
      fullName,
      email,
      password,
    });

    return NextResponse.json({
      success: true,
      message: "Registration successful",
      data: result,
    });
  } catch (error) {
    console.error("Register error:", error);

    const message =
      error instanceof Error ? error.message : "Registration failed";

    return NextResponse.json(
      {
        success: false,
        message,
      },
      { status: 400 }
    );
  }
}