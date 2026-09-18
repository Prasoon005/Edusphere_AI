import multer from "multer";
import path from "path";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";
import { env } from "../config/env";
import { ApiError } from "../utils/apiError";

const UPLOAD_ROOT = path.resolve(process.cwd(), env.UPLOAD_DIR);

const SUBDIRS = ["assignments", "materials", "avatars", "reports", "misc"] as const;
export type UploadCategory = (typeof SUBDIRS)[number];

for (const dir of SUBDIRS) {
  const full = path.join(UPLOAD_ROOT, dir);
  if (!fs.existsSync(full)) fs.mkdirSync(full, { recursive: true });
}

const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "image/png",
  "image/jpeg",
  "image/webp",
  "text/plain",
  "application/zip",
]);

function storageFor(category: UploadCategory) {
  return multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, path.join(UPLOAD_ROOT, category)),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname);
      cb(null, `${uuidv4()}${ext}`);
    },
  });
}

export function uploadMiddleware(category: UploadCategory) {
  return multer({
    storage: storageFor(category),
    limits: { fileSize: env.MAX_FILE_SIZE_MB * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
      if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
        return cb(ApiError.badRequest(`File type not allowed: ${file.mimetype}`));
      }
      cb(null, true);
    },
  });
}

/** Builds a public-facing relative URL for a stored file, ready to be prefixed with the API base URL. */
export function publicFileUrl(category: UploadCategory, filename: string): string {
  return `/uploads/${category}/${filename}`;
}
