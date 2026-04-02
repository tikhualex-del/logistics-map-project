import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { requireSession } from "@/server/auth/require-session";
import { requireMinRole } from "@/server/auth/require-role";

const ALLOWED_TYPES = ["image/png", "image/svg+xml", "image/webp", "image/jpeg"];
const MAX_FILE_SIZE = 2 * 1024 * 1024;

function getSafeFileExtension(mimeType: string) {
    switch (mimeType) {
        case "image/png":
            return "png";
        case "image/svg+xml":
            return "svg";
        case "image/webp":
            return "webp";
        case "image/jpeg":
            return "jpg";
        default:
            return null;
    }
}

export async function POST(request: Request) {
    try {
        const session = await requireSession();
        requireMinRole(session, "admin");

        const formData = await request.formData();
        const file = formData.get("file");

        if (!(file instanceof File)) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Файл не найден",
                },
                { status: 400 }
            );
        }

        if (!ALLOWED_TYPES.includes(file.type)) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Допустимы только PNG, SVG, WEBP или JPG",
                },
                { status: 400 }
            );
        }

        if (file.size > MAX_FILE_SIZE) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Файл слишком большой. Максимум 2 MB",
                },
                { status: 400 }
            );
        }

        const ext = getSafeFileExtension(file.type);

        if (!ext) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Не удалось определить расширение файла",
                },
                { status: 400 }
            );
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        const fileName = `map-status-icon-${Date.now()}-${Math.random()
            .toString(36)
            .slice(2, 8)}.${ext}`;

        const uploadDir = path.join(process.cwd(), "public", "uploads", "map-status-icons");
        const filePath = path.join(uploadDir, fileName);

        await mkdir(uploadDir, { recursive: true });
        await writeFile(filePath, buffer);

        return NextResponse.json({
            success: true,
            message: "Иконка успешно загружена",
            data: {
                fileName,
                url: `/uploads/map-status-icons/${fileName}`,
            },
        });
    } catch (error) {
        console.error("Upload map status icon error:", error);

        const message =
            error instanceof Error ? error.message : "Не удалось загрузить иконку";

        const status =
            message === "Not authenticated"
                ? 401
                : message === "Forbidden"
                    ? 403
                    : 500;

        return NextResponse.json(
            {
                success: false,
                message,
            },
            { status }
        );
    }
}