import { NextResponse } from "next/server";
import { z } from "zod";
import { createOwnerBundle } from "@/server/auth/auth.service";

const registerSchema = z.object({
  companyName: z.string().trim().min(2, "Название компании — минимум 2 символа"),
  fullName: z.string().trim().min(2, "Имя — минимум 2 символа"),
  email: z.email("Некорректный email").transform((v) => v.trim().toLowerCase()),
  password: z.string().min(8, "Пароль — минимум 8 символов"),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          message: parsed.error.issues[0]?.message || "Некорректные данные",
          errors: parsed.error.flatten(),
        },
        { status: 400 }
      );
    }

    const { companyName, fullName, email, password } = parsed.data;

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