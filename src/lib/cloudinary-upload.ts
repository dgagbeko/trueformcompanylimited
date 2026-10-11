export type UploadSignature = { cloudName: string; apiKey: string; folder: string; timestamp: number; signature: string };

/**
 * Upload a file from the browser straight to Cloudinary using a server-made signature.
 * Returns the hosted URL, or Cloudinary's own error message so setup problems are easy to fix.
 */
export async function uploadToCloudinary(file: File, sig: UploadSignature): Promise<{ url: string; publicId: string } | { error: string }> {
  const isVideo = file.type.startsWith("video/");
  const body = new FormData();
  body.append("file", file);
  body.append("api_key", sig.apiKey);
  body.append("timestamp", String(sig.timestamp));
  body.append("signature", sig.signature);
  body.append("folder", sig.folder);
  try {
    const res = await fetch(`https://api.cloudinary.com/v1_1/${encodeURIComponent(sig.cloudName)}/${isVideo ? "video" : "image"}/upload`, { method: "POST", body });
    const json = (await res.json().catch(() => ({}))) as { secure_url?: string; public_id?: string; error?: { message?: string } };
    if (!res.ok || !json.secure_url) return { error: json.error?.message ?? `Cloudinary returned ${res.status}` };
    return { url: json.secure_url, publicId: json.public_id ?? "" };
  } catch {
    return { error: "could not reach Cloudinary. Check your internet connection and try again." };
  }
}
