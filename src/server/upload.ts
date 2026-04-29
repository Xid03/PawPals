import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { ApiRouteError } from "./responses";

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "video/mp4",
  "video/webm"
]);

const EXTENSIONS: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
  "video/mp4": ".mp4",
  "video/webm": ".webm"
};

export function validateUpload(file: File) {
  const maxBytes = Number(process.env.MAX_UPLOAD_BYTES ?? 5 * 1024 * 1024);

  if (!ALLOWED_TYPES.has(file.type)) {
    throw new ApiRouteError(400, "BAD_REQUEST", "Unsupported upload file type");
  }

  if (file.size > maxBytes) {
    throw new ApiRouteError(400, "BAD_REQUEST", "Upload exceeds the maximum file size");
  }
}

export async function saveUpload(file: File, folder: string) {
  validateUpload(file);

  const uploadRoot = process.env.UPLOAD_DIR ?? "public/uploads";
  const safeFolder = folder.replace(/[^a-z0-9-]/gi, "").toLowerCase();
  const targetDir = path.join(process.cwd(), uploadRoot, safeFolder);
  await mkdir(targetDir, { recursive: true });

  const extension = EXTENSIONS[file.type] ?? "";
  const fileName = `${randomUUID()}${extension}`;
  const filePath = path.join(targetDir, fileName);
  const bytes = Buffer.from(await file.arrayBuffer());
  await writeFile(filePath, bytes);

  return `/uploads/${safeFolder}/${fileName}`;
}
