import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST() {
  throw new Error("Endpoint disabled");
  try {
    const company = await prisma.company.create({
      data: {
        name: "Test Company",
        timezone: "Europe/Moscow",
      },
    });

    return NextResponse.json({
      success: true,
      message: "Company created successfully",
      data: company,
    });
  } catch (error) {
    console.error("Create company error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to create company",
      },
      { status: 500 }
    );
  }
}