import { NextResponse } from "next/server";
import { requireSession } from "@/server/auth/require-session";
import { prisma } from "@/lib/prisma";

type WorkingDayKey =
    | "MONDAY"
    | "TUESDAY"
    | "WEDNESDAY"
    | "THURSDAY"
    | "FRIDAY"
    | "SATURDAY"
    | "SUNDAY";

type WorkingHoursDay = {
    day: WorkingDayKey;
    isWorking: boolean;
    from: string;
    to: string;
};

type WorkingHoursData = {
    timezone: string;
    days: WorkingHoursDay[];
};

const DEFAULT_WORKING_HOURS: WorkingHoursData = {
    timezone: "Europe/Moscow",
    days: [
        { day: "MONDAY", isWorking: true, from: "09:00", to: "18:00" },
        { day: "TUESDAY", isWorking: true, from: "09:00", to: "18:00" },
        { day: "WEDNESDAY", isWorking: true, from: "09:00", to: "18:00" },
        { day: "THURSDAY", isWorking: true, from: "09:00", to: "18:00" },
        { day: "FRIDAY", isWorking: true, from: "09:00", to: "18:00" },
        { day: "SATURDAY", isWorking: false, from: "09:00", to: "18:00" },
        { day: "SUNDAY", isWorking: false, from: "09:00", to: "18:00" },
    ],
};

function normalizeWorkingHours(
    rawValue: string | null,
    companyTimezone: string
): WorkingHoursData {
    if (!rawValue) {
        return {
            ...DEFAULT_WORKING_HOURS,
            timezone: companyTimezone || DEFAULT_WORKING_HOURS.timezone,
        };
    }

    try {
        const parsed = JSON.parse(rawValue) as Partial<WorkingHoursData>;

        const normalizedDays = Array.isArray(parsed?.days)
            ? DEFAULT_WORKING_HOURS.days.map((defaultDay) => {
                const matched = parsed.days?.find((item) => item?.day === defaultDay.day);

                return {
                    day: defaultDay.day,
                    isWorking:
                        typeof matched?.isWorking === "boolean"
                            ? matched.isWorking
                            : defaultDay.isWorking,
                    from:
                        typeof matched?.from === "string" && matched.from.trim()
                            ? matched.from
                            : defaultDay.from,
                    to:
                        typeof matched?.to === "string" && matched.to.trim()
                            ? matched.to
                            : defaultDay.to,
                };
            })
            : DEFAULT_WORKING_HOURS.days;

        return {
            timezone:
                typeof parsed?.timezone === "string" && parsed.timezone.trim()
                    ? parsed.timezone
                    : companyTimezone || DEFAULT_WORKING_HOURS.timezone,
            days: normalizedDays,
        };
    } catch {
        return {
            ...DEFAULT_WORKING_HOURS,
            timezone: companyTimezone || DEFAULT_WORKING_HOURS.timezone,
        };
    }
}

export async function GET() {
    try {
        const session = await requireSession();

        const company = await prisma.company.findUnique({
            where: {
                id: session.companyId,
            },
            select: {
                timezone: true,
                workingHoursJson: true,
            },
        });

        if (!company) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Company not found",
                },
                { status: 404 }
            );
        }

        const data = normalizeWorkingHours(
            company.workingHoursJson,
            company.timezone
        );

        return NextResponse.json({
            success: true,
            data,
        });
    } catch (error) {
        console.error("Get working hours error:", error);

        const message =
            error instanceof Error ? error.message : "Failed to load working hours";

        const status = message === "Not authenticated" ? 401 : 500;

        return NextResponse.json(
            {
                success: false,
                message,
            },
            { status }
        );
    }
}

export async function PUT(request: Request) {
    try {
        const session = await requireSession();

        const body = await request.json();

        const timezone =
            typeof body?.timezone === "string" && body.timezone.trim()
                ? body.timezone.trim()
                : "";

        const days = Array.isArray(body?.days) ? body.days : null;

        if (!timezone) {
            return NextResponse.json(
                {
                    success: false,
                    message: "timezone is required",
                },
                { status: 400 }
            );
        }

        if (!days) {
            return NextResponse.json(
                {
                    success: false,
                    message: "days must be an array",
                },
                { status: 400 }
            );
        }

        const allowedDays: WorkingDayKey[] = [
            "MONDAY",
            "TUESDAY",
            "WEDNESDAY",
            "THURSDAY",
            "FRIDAY",
            "SATURDAY",
            "SUNDAY",
        ];

        const normalizedDays: WorkingHoursDay[] = allowedDays.map((dayKey) => {
            const matched = days.find((item: any) => item?.day === dayKey);

            const isWorking =
                typeof matched?.isWorking === "boolean" ? matched.isWorking : false;

            const from =
                typeof matched?.from === "string" && /^\d{2}:\d{2}$/.test(matched.from)
                    ? matched.from
                    : "09:00";

            const to =
                typeof matched?.to === "string" && /^\d{2}:\d{2}$/.test(matched.to)
                    ? matched.to
                    : "18:00";

            return {
                day: dayKey,
                isWorking,
                from,
                to,
            };
        });

        const payload: WorkingHoursData = {
            timezone,
            days: normalizedDays,
        };

        await prisma.company.update({
            where: {
                id: session.companyId,
            },
            data: {
                workingHoursJson: JSON.stringify(payload),
            },
        });

        return NextResponse.json({
            success: true,
            message: "Working hours updated successfully",
            data: payload,
        });
    } catch (error) {
        console.error("Update working hours error:", error);

        const message =
            error instanceof Error ? error.message : "Failed to update working hours";

        const status = message === "Not authenticated" ? 401 : 500;

        return NextResponse.json(
            {
                success: false,
                message,
            },
            { status }
        );
    }
}