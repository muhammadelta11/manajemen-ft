import { createHash, randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const ALLOWED_MIME = new Set(["application/pdf", "image/jpeg", "image/png"]);
const MAX_BYTES = 10 * 1024 * 1024;

export type StoredFile = {
  key: string;
  mime: string;
  size: number;
  checksum: string;
};

function getS3() {
  const endpoint = process.env.MINIO_ENDPOINT;
  const accessKey = process.env.MINIO_ACCESS_KEY;
  const secretKey = process.env.MINIO_SECRET_KEY;
  if (!endpoint || !accessKey || !secretKey) return null;

  return new S3Client({
    region: process.env.MINIO_REGION ?? "us-east-1",
    endpoint,
    forcePathStyle: true,
    credentials: {
      accessKeyId: accessKey,
      secretAccessKey: secretKey,
    },
  });
}

export function assertAllowedFile(mime: string, size: number) {
  if (!ALLOWED_MIME.has(mime)) {
    throw new Error("Tipe berkas tidak diizinkan. Gunakan PDF, JPG, atau PNG.");
  }
  if (size > MAX_BYTES) {
    throw new Error("Ukuran berkas melebihi 10 MB.");
  }
}

function buildKey(folder: string, filename: string) {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const safe = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
  return `${folder}/${yyyy}/${mm}/${randomUUID()}-${safe}`;
}

export async function storeFile(
  folder: "surat" | "bukti-aktivitas",
  file: File,
): Promise<StoredFile> {
  const buffer = Buffer.from(await file.arrayBuffer());
  assertAllowedFile(file.type, buffer.length);
  const checksum = createHash("sha256").update(buffer).digest("hex");
  const key = buildKey(folder, file.name);

  const s3 = getS3();
  const bucket = process.env.MINIO_BUCKET ?? "manajeman-ft";

  if (s3) {
    await s3.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: buffer,
        ContentType: file.type,
      }),
    );
  } else {
    const root = process.env.LOCAL_UPLOAD_DIR ?? path.join(process.cwd(), "uploads");
    const full = path.join(root, key);
    await mkdir(path.dirname(full), { recursive: true });
    await writeFile(full, buffer);
  }

  return {
    key,
    mime: file.type,
    size: buffer.length,
    checksum,
  };
}
