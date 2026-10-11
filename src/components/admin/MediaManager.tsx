"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Media } from "@/db/schema";
import { addMedia, getUploadSignature, removeMedia, reorderMedia } from "@/app/admin/actions";
import { imageUrl } from "@/lib/media";
import { uploadToCloudinary } from "@/lib/cloudinary-upload";

const MAX_IMAGE_MB = 10;
const MAX_VIDEO_MB = 100;

export function MediaManager({ listingId, items, cloudinary }: { listingId: string; items: Media[]; cloudinary: boolean }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [url, setUrl] = useState("");
  // Local copy of the order so arrow clicks show instantly, even on a slow connection.
  const [order, setOrder] = useState(items);
  const [saving, setSaving] = useState<"" | "saving" | "saved" | "failed">("");
  const pendingSaves = useRef(0);

  // Take the server's version when it changes (upload, removal, page refresh), unless a save is in flight.
  const serverKey = items.map((m) => `${m.id}:${m.sortOrder}`).join(",");
  useEffect(() => {
    if (pendingSaves.current === 0) setOrder(items);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serverKey]);

  const coverId = order.find((m) => m.kind === "image")?.id;

  async function saveOrder(next: Media[]) {
    setOrder(next);
    setSaving("saving");
    pendingSaves.current++;
    try {
      // The whole order is sent each time, so the last click always wins.
      await reorderMedia(listingId, next.map((m) => m.id));
      pendingSaves.current--;
      if (pendingSaves.current === 0) setSaving("saved");
    } catch {
      pendingSaves.current--;
      setSaving("failed");
    }
  }

  const move = (index: number, delta: number) => {
    const j = index + delta;
    if (j < 0 || j >= order.length) return;
    const next = [...order];
    [next[index], next[j]] = [next[j], next[index]];
    saveOrder(next);
  };

  const makeCover = (index: number) => {
    const next = [...order];
    const [item] = next.splice(index, 1);
    saveOrder([item, ...next]);
  };

  async function remove(id: string) {
    if (!confirm("Remove this file from the listing?")) return;
    setOrder((o) => o.filter((m) => m.id !== id));
    const fd = new FormData();
    fd.append("id", id);
    await removeMedia(fd);
    router.refresh();
  }

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
      const up = await uploadToCloudinary(file, sig);
      if ("error" in up) { setError(`Upload failed for ${file.name}: ${up.error}`); continue; }
      await addMedia(listingId, up.url, isVideo ? "video" : "image", up.publicId || null);
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

  return (
    <section className="box stack">
      <div className="row between">
        <h2 style={{ fontSize: 18 }}>Photos &amp; videos</h2>
        <span className="hint" role="status">
          {saving === "saving" ? "Saving order…" : saving === "saved" ? "Order saved ✓" : saving === "failed" ? "Could not save the order — refresh and try again." : "The first photo is the cover image. Use the arrows or “Make cover” to reorder."}
        </span>
      </div>
      {cloudinary ? (
        <div className="row">
          <label className="btn btn-ink" style={{ cursor: "pointer" }}>
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
        {order.map((m, i) => (
          <div key={m.id} className="card" style={{ overflow: "hidden", outline: m.id === coverId ? "2px solid var(--accent)" : undefined }}>
            <div className="photo" style={{ height: 130, padding: 8 }}>
              {m.kind === "image" ? <img src={imageUrl(m.url, 400)} alt="" /> : <video src={m.url} muted preload="metadata" />}
              <span style={{ position: "relative" }} className="tag">{m.id === coverId ? "COVER" : `${i + 1} · ${m.kind.toUpperCase()}`}</span>
            </div>
            <div className="row" style={{ padding: 8, gap: 6, justifyContent: "space-between" }}>
              <span className="row" style={{ gap: 6 }}>
                <button type="button" className="btn btn-line btn-sm" aria-label="Move earlier" disabled={i === 0} onClick={() => move(i, -1)}>←</button>
                <button type="button" className="btn btn-line btn-sm" aria-label="Move later" disabled={i === order.length - 1} onClick={() => move(i, 1)}>→</button>
              </span>
              <button type="button" className="btn btn-danger btn-sm" onClick={() => remove(m.id)}>Remove</button>
            </div>
            {m.kind === "image" && m.id !== coverId && (
              <div style={{ padding: "0 8px 8px" }}>
                <button type="button" className="btn btn-line btn-sm" style={{ width: "100%" }} onClick={() => makeCover(i)}>Make cover</button>
              </div>
            )}
          </div>
        ))}
        {order.length === 0 && <p className="muted">No photos or videos yet.</p>}
      </div>
    </section>
  );
}
