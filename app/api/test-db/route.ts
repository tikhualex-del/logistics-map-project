import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  throw new Error("Endpoint disabled");
  try {
    const companiesCount = await prisma.company.count();

    return NextResponse.json({
      success: true,
      message: "Database connection is working",
      data: {
        companiesCount,
      },
    });
  } catch (error) {
    console.error("DB test error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Database connection failed",
      },
      { status: 500 }
    );
  }
}