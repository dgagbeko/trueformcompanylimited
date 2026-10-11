import { createHash } from "node:crypto";

/** Env values are often pasted with stray spaces or quotes, which silently break the signature. */
const env = (k: string) => process.env[k]?.trim().replace(/^["']|["']$/g, "").trim() ?? "";

export const cloudinaryConfigured = () =>
  Boolean(env("CLOUDINARY_CLOUD_NAME") && env("CLOUDINARY_API_KEY") && env("CLOUDINARY_API_SECRET"));

/** Signature for a direct browser-to-Cloudinary upload (the file never passes through our server). */
export function signUpload(folder: string) {
  const timestamp = Math.floor(Date.now() / 1000);
  const toSign = `folder=${folder}&timestamp=${timestamp}${env("CLOUDINARY_API_SECRET")}`;
  return {
    cloudName: env("CLOUDINARY_CLOUD_NAME"),
    apiKey: env("CLOUDINARY_API_KEY"),
    folder,
    timestamp,
    signature: createHash("sha1").update(toSign).digest("hex"),
  };
}
