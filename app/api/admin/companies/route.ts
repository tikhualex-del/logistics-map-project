import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { getCurrentUserBySessionToken } from "@/server/auth/auth.service";
import { isAdminEmail } from "@/server/admin/admin-access";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("session_token")?.value;

    if (!sessionToken) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const current = await getCurrentUserBySessionToken(sessionToken);

    if (!isAdminEmail(current.user.email)) {
      return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
    }

    const companies = await prisma.company.findMany({
      orderBy: {
        createdAt: "desc",
      },
      include: {
        memberships: {
          include: {
            user: true,
          },
        },
      },
    });

    const result = companies.map((company) => {
      const owner = company.memberships.find(
        (m) => m.role === "owner"
      );

      return {
        id: company.id,
        name: company.name,
        createdAt: company.createdAt,
        ownerEmail: owner?.user?.email || "—",
        isActive: company.isActive,
      };
    });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Admin companies error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to load companies",
      },
      { status: 500 }
    );
  }
}