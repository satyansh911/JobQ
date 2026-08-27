import { v2 as cloudinary } from "cloudinary";
import crypto from "crypto";
import fs from "fs";
import path from "path";

export const UPLOAD_DIR = path.resolve(process.cwd(), "uploads");

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const MIME_EXT: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/svg+xml": "svg",
  "application/pdf": "pdf",
};

export interface StoredFile {
  url: string;
  public_id: string;
  driver: "cloudinary" | "local";
}

const selfUrl = () =>
  process.env.SELF_URL || `http://localhost:${process.env.PORT || 5001}`;

/**
 * Persist a base64 data-URI.
 *
 * Cloudinary is the primary driver. If it is unreachable or the account
 * rejects the upload (an unverified account returns 403 on every upload while
 * still answering `api.ping`), we fall back to local disk so the product keeps
 * working instead of failing the whole request chain — company logos, résumés
 * and profile pictures all flow through here.
 */
export async function storeDataUri(
  dataUri: string,
  previousPublicId?: string
): Promise<StoredFile> {
  if (previousPublicId) {
    await removeStored(previousPublicId);
  }

  try {
    const cloud = await cloudinary.uploader.upload(dataUri, {
      resource_type: "auto",
    });
    return {
      url: cloud.secure_url,
      public_id: cloud.public_id,
      driver: "cloudinary",
    };
  } catch (error: any) {
    console.warn(
      `[storage] Cloudinary upload failed (${error?.http_code || "?"}: ${
        error?.message
      }) — falling back to local disk.`
    );
    return storeLocally(dataUri);
  }
}

function storeLocally(dataUri: string): StoredFile {
  const match = /^data:([^;]+);base64,(.+)$/s.exec(dataUri);
  if (!match) {
    throw new Error("Expected a base64 data URI");
  }

  const [, mime, b64] = match;
  const ext = MIME_EXT[mime] || "bin";
  const id = `${Date.now()}-${crypto.randomBytes(6).toString("hex")}`;
  const filename = `${id}.${ext}`;

  fs.writeFileSync(path.join(UPLOAD_DIR, filename), Buffer.from(b64, "base64"));

  return {
    url: `${selfUrl()}/uploads/${filename}`,
    // `local:` prefix lets removeStored() route deletes to the right driver
    public_id: `local:${filename}`,
    driver: "local",
  };
}

export async function removeStored(publicId: string): Promise<void> {
  try {
    if (publicId.startsWith("local:")) {
      const filename = path.basename(publicId.slice("local:".length));
      const target = path.join(UPLOAD_DIR, filename);
      if (fs.existsSync(target)) fs.unlinkSync(target);
      return;
    }
    await cloudinary.uploader.destroy(publicId);
  } catch (error: any) {
    // A failed cleanup of an old asset must never fail the new upload.
    console.warn(`[storage] Could not remove "${publicId}": ${error?.message}`);
  }
}
