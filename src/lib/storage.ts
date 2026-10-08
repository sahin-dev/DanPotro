import "server-only";

import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { addFileRecord, getFileRecord } from "@/lib/db";
import { env } from "@/lib/env";
import { badRequest, notFound } from "@/lib/errors";
import type { StoredFile } from "@/lib/types";

/*
 * Private evidence storage on local disk, outside `public/`. Swap `saveUpload`/`readUpload`
 * internals for encrypted object storage (S3, R2, GCS) when running more than one instance.
 */

const ascii = (bytes: Uint8Array, start: number, end: number) => String.fromCharCode(...bytes.slice(start, end));

const SIGNATURES: Array<{ mimeType: string; test: (bytes: Uint8Array) => boolean }> = [
  { mimeType: "image/png", test: (b) => b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 },
  { mimeType: "image/jpeg", test: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  { mimeType: "image/webp", test: (b) => ascii(b, 0, 4) === "RIFF" && ascii(b, 8, 12) === "WEBP" },
  { mimeType: "application/pdf", test: (b) => ascii(b, 0, 5) === "%PDF-" },
];

const storagePath = (fileId: string) => path.resolve(env.evidenceDir, fileId);

function sanitizeName(name: string) {
  return path.basename(name).replace(/[^\w.\- ]+/g, "_").slice(-120) || "evidence";
}

/** Validates by content (not the browser-supplied type), hashes, and stores a private upload. */
export async function saveUpload(file: File, ownerId: string): Promise<StoredFile> {
  if (file.size > env.maxUploadBytes) {
    throw badRequest(`Files must be ${Math.round(env.maxUploadBytes / 1024 / 1024)} MB or smaller.`);
  }
  const bytes = new Uint8Array(await file.arrayBuffer());
  const kind = SIGNATURES.find((entry) => entry.test(bytes));
  if (!kind) throw badRequest("Upload a PNG, JPG, WebP, or PDF file.");

  const record: StoredFile = {
    id: `fil-${crypto.randomUUID()}`,
    ownerId,
    fileName: sanitizeName(file.name),
    mimeType: kind.mimeType,
    size: bytes.byteLength,
    sha256: createHash("sha256").update(bytes).digest("hex"),
    createdAt: new Date().toISOString(),
  };
  await mkdir(path.resolve(env.evidenceDir), { recursive: true });
  await writeFile(storagePath(record.id), bytes, { mode: 0o600 });
  return addFileRecord(record);
}

export async function readUpload(fileId: string) {
  const record = getFileRecord(fileId);
  if (!record) throw notFound("File not found.");
  try {
    return { record, data: await readFile(storagePath(record.id)) };
  } catch {
    throw notFound("The file is no longer available.");
  }
}
