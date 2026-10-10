"use client";
import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Media } from "@/db/schema";
import { addMedia, getUploadSignature, moveMedia, removeMedia } from "@/app/admin/actions";
import { imageUrl } from "@/lib/media";

const MAX_IMAGE_MB = 10;
const MAX_VIDEO_MB = 100;

export function MediaManager({ listingId, items, cloudinary }: { listingId: string; items: Media[]; cloudinary: boolean }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [url, setUrl] = useState("");
  const [, startTransition] = useTransition();

  async function upload(files: FileList | null) {
    if (!files?.length) return;
    setError("");
    for (const [i, file] of Array.from(files).entries()) {
      const isVideo = file.type.startsWith("video/");
      if (!isVideo && !file.type.startsWith("image/")) { setError(`${file.name} is not an image or video.`); continue; }
      if (file.size > (isVideo ? MAX_VIDEO_MB : MAX_IMAGE_MB) * 1024 * 1024) { setError(`${file.name} is too large (max ${isVideo ? MAX_VIDEO_MB : MAX_IMAGE_MB} MB).`); continue; }
      setBusy(`Uploading ${i + 1} of ${files.length}: ${file.name}…`);
      const sig = await getUploadSignature(listingId);
      if (!sig) { setError("Cloudinary is not configured."); break; }
      const body = new FormData();
      body.append("file", file);
      body.append("api_key", sig.apiKey);
      body.append("timestamp", String(sig.timestamp));
      body.append("signature", sig.signature);
      body.append("folder", sig.folder);
      const res = await fetch(`https://api.cloudinary.com/v1_1/${sig.cloudName}/${isVideo ? "video" : "image"}/upload`, { method: "POST", body });
      if (!res.ok) { setError(`Upload failed for ${file.name}.`); continue; }
      const json = (await res.json()) as { secure_url: string; public_id: string };
      await addMedia(listingId, json.secure_url, isVideo ? "video" : "image", json.public_id);
    }
    setBusy("");
    if (fileRef.current) fileRef.current.value = "";
    router.refresh();
  }

  async function addByUrl() {
    setError("");
    const kind = /\.(mp4|webm|mov)(\?|$)/i.test(url) ? "video" : "image";
    const r = await addMedia(listingId, url.trim(), kind, null);
    if (r.error) setError(r.error);
    else { setUrl(""); router.refresh(); }
  }

  const act = (fn: (fd: FormData) => Promise<void>, fields: Record<string, string>) => () => {
    const fd = new FormData();
    Object.entries(fields).forEach(([k, v]) => fd.append(k, v));
    startTransition(async () => { await fn(fd); router.refresh(); });
  };

  return (
    <section className="box stack">
      <div className="row between">
        <h2 style={{ fontSize: 18 }}>Photos &amp; videos</h2>
        <span className="hint">The first photo is the cover image. Use the arrows to reorder.</span>
      </div>
      {cloudinary ? (
        <div className="row">
          <label className="btn btn-navy" style={{ cursor: "pointer" }}>
            Upload photos or videos
            <input ref={fileRef} type="file" accept="image/*,video/*" multiple className="sr-only" onChange={(e) => upload(e.target.files)} disabled={Boolean(busy)} />
          </label>
          <span className="hint">Images up to {MAX_IMAGE_MB} MB, videos up to {MAX_VIDEO_MB} MB. Images are resized and compressed automatically.</span>
        </div>
      ) : (
        <p className="alert alert-info">Direct uploads turn on when Cloudinary keys are added. Meanwhile you can paste a public image or video link below.</p>
      )}
      <div className="row" style={{ alignItems: "flex-end" }}>
        <div className="field" style={{ flex: "3 1 300px" }}>
          <label htmlFor="media-url">Or add by link (https://…)</label>
          <input id="media-url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://…/photo.jpg" />
        </div>
        <button type="button" className="btn btn-line" onClick={addByUrl} disabled={!url}>Add link</button>
      </div>
      {busy && <p className="alert alert-info" role="status">{busy}</p>}
      {error && <p className="alert alert-error" role="alert">{error}</p>}
      <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 12 }}>
        {items.map((m, i) => (
          <div key={m.id} className="card" style={{ overflow: "hidden" }}>
            <div className="photo" style={{ height: 130, padding: 8 }}>
              {m.kind === "image" ? <img src={imageUrl(m.url, 400)} alt="" /> : <video src={m.url} muted preload="metadata" />}
              <span style={{ position: "relative" }} className="tag">{i === 0 && m.kind === "image" ? "COVER" : m.kind.toUpperCase()}</span>
            </div>
            <div className="row" style={{ padding: 8, gap: 6, justifyContent: "space-between" }}>
              <span className="row" style={{ gap: 6 }}>
                <button type="button" className="btn btn-line btn-sm" aria-label="Move earlier" disabled={i === 0} onClick={act(moveMedia, { id: m.id, dir: "up" })}>←</button>
                <button type="button" className="btn btn-line btn-sm" aria-label="Move later" disabled={i === items.length - 1} onClick={act(moveMedia, { id: m.id, dir: "down" })}>→</button>
              </span>
              <button type="button" className="btn btn-danger btn-sm" onClick={() => confirm("Remove this file from the listing?") && act(removeMedia, { id: m.id })()}>Remove</button>
            </div>
          </div>
        ))}
        {items.length === 0 && <p className="muted">No photos or videos yet.</p>}
      </div>
    </section>
  );
}
