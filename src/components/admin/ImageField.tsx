"use client";
import { useRef, useState } from "react";
import { getSiteUploadSignature } from "@/app/admin/actions";
import { uploadToCloudinary } from "@/lib/cloudinary-upload";
import { imageUrl } from "@/lib/media";

/** A settings image: upload to Cloudinary or paste a link. The URL is submitted with the form as `name`. */
export function ImageField({ name, label, defaultValue, hint }: { name: string; label: string; defaultValue: string; hint?: string }) {
  const [url, setUrl] = useState(defaultValue);
  const [status, setStatus] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  async function upload(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith("image/")) return setStatus("Please choose an image file.");
    setStatus("Uploading…");
    const sig = await getSiteUploadSignature();
    if (!sig) return setStatus("Uploads need Cloudinary keys. Paste an image link instead.");
    const up = await uploadToCloudinary(file, sig);
    if ("error" in up) return setStatus(`Upload failed: ${up.error}`);
    setUrl(up.url);
    setStatus("Uploaded — click Save settings to publish it.");
    if (fileRef.current) fileRef.current.value = "";
  }

  return (
    <div className="row" style={{ alignItems: "stretch", gap: 14, flexWrap: "nowrap" }}>
      <div className="photo" style={{ width: 120, minHeight: 96, flex: "0 0 auto", borderRadius: 14, padding: 8 }}>
        {url ? <img src={imageUrl(url, 300)} alt="" /> : <span>No photo</span>}
      </div>
      <div className="stack" style={{ gap: 8, flex: 1, minWidth: 0 }}>
        <div className="field" style={{ flex: "0 0 auto" }}>
          <label htmlFor={name}>{label}</label>
          <input id={name} name={name} value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://… (or upload)" />
        </div>
        <div className="row" style={{ gap: 8 }}>
          <label className="btn btn-line btn-sm" style={{ cursor: "pointer" }}>
            Upload photo
            <input ref={fileRef} type="file" accept="image/*" className="sr-only" onChange={(e) => upload(e.target.files?.[0])} />
          </label>
          {url && <button type="button" className="btn btn-danger btn-sm" onClick={() => setUrl("")}>Remove</button>}
          {(status || hint) && <span className="hint" role="status">{status || hint}</span>}
        </div>
      </div>
    </div>
  );
}
