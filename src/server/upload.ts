import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { createHash, randomUUID } from "crypto";
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

export type UploadFile = {
  type: string;
  size: number;
  arrayBuffer: () => Promise<ArrayBuffer>;
};

export function isUploadFile(value: unknown): value is UploadFile {
  if (!value || typeof value !== "object") return false;

  const candidate = value as Partial<UploadFile>;
  return (
    typeof candidate.type === "string" &&
    typeof candidate.size === "number" &&
    typeof candidate.arrayBuffer === "function"
  );
}

export function validateUpload(file: UploadFile) {
  const maxBytes = Number(process.env.MAX_UPLOAD_BYTES ?? 5 * 1024 * 1024);

  if (!ALLOWED_TYPES.has(file.type)) {
    throw new ApiRouteError(400, "BAD_REQUEST", "Unsupported upload file type");
  }

  if (file.size > maxBytes) {
    throw new ApiRouteError(400, "BAD_REQUEST", "Upload exceeds the maximum file size");
  }
}

type CloudinaryUploadResponse = {
  secure_url?: string;
  error?: {
    message?: string;
  };
};

function cloudinaryConfig() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) return null;
  return { cloudName, apiKey, apiSecret };
}

function signCloudinaryParams(params: Record<string, string>, apiSecret: string) {
  const payload = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join("&");

  return createHash("sha1").update(`${payload}${apiSecret}`).digest("hex");
}

async function uploadToCloudinary(file: UploadFile, folder: string) {
  const config = cloudinaryConfig();
  if (!config) return null;

  const safeFolder = folder.replace(/[^a-z0-9-]/gi, "").toLowerCase() || "media";
  const extension = EXTENSIONS[file.type] ?? "";
  const publicId = `${safeFolder}/${randomUUID()}`;
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const signatureParams = {
    public_id: publicId,
    timestamp
  };
  const bytes = new Uint8Array(await file.arrayBuffer());
  const formData = new FormData();

  formData.append("file", new Blob([bytes], { type: file.type }), `${publicId}${extension}`);
  formData.append("api_key", config.apiKey);
  formData.append("public_id", publicId);
  formData.append("timestamp", timestamp);
  formData.append("signature", signCloudinaryParams(signatureParams, config.apiSecret));

  const response = await fetch(`https://api.cloudinary.com/v1_1/${config.cloudName}/auto/upload`, {
    method: "POST",
    body: formData
  });
  const payload = (await response.json().catch(() => ({}))) as CloudinaryUploadResponse;

  if (!response.ok || !payload.secure_url) {
    throw new ApiRouteError(500, "INTERNAL_ERROR", payload.error?.message ?? "Cloudinary upload failed");
  }

  return payload.secure_url;
}

export async function saveUpload(file: UploadFile, folder: string) {
  validateUpload(file);

  const cloudinaryUrl = await uploadToCloudinary(file, folder);
  if (cloudinaryUrl) {
    return cloudinaryUrl;
  }

  if (process.env.NODE_ENV === "production") {
    throw new ApiRouteError(500, "INTERNAL_ERROR", "Cloudinary upload is not configured");
  }

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
