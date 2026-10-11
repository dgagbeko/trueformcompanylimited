"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { imageUrl } from "@/lib/media";

type Photo = { id: string; url: string };

/** Listing photo grid; clicking any photo opens a full-screen viewer with next/previous. */
export function Gallery({ photos, title }: { photos: Photo[]; title: string }) {
  const [open, setOpen] = useState<number | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const touchX = useRef<number | null>(null);
  const count = photos.length;

  const go = useCallback((delta: number) => setOpen((i) => (i === null ? i : (i + delta + count) % count)), [count]);

  useEffect(() => {
    if (open === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(null);
      else if (e.key === "ArrowRight") go(1);
      else if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
    };
  }, [open, go]);

  if (count === 0) {
    return (
      <div className="gallery" style={{ gridTemplateColumns: "1fr", gridAutoRows: "min(420px, 60vw)" }}>
        <div className="photo">Photos coming soon</div>
      </div>
    );
  }

  return (
    <>
      <div className="gallery-wrap">
        <div className="gallery" style={count <= 1 ? { gridTemplateColumns: "1fr", gridAutoRows: "min(420px, 60vw)" } : undefined}>
          {photos.slice(0, 5).map((p, i) => (
            <button key={p.id} type="button" className="photo gallery-item" onClick={() => setOpen(i)} aria-label={`Open photo ${i + 1} of ${count}`}>
              <img src={imageUrl(p.url, i === 0 ? 1200 : 600)} alt="" loading={i === 0 ? "eager" : "lazy"} />
            </button>
          ))}
        </div>
        {count > 1 && (
          <button type="button" className="btn btn-line btn-sm gallery-all" onClick={() => setOpen(0)}>
            View all {count} photos
          </button>
        )}
      </div>

      {open !== null && (
        <div
          className="lightbox"
          role="dialog"
          aria-modal="true"
          aria-label={`${title} — photo ${open + 1} of ${count}`}
          onClick={(e) => e.target === e.currentTarget && setOpen(null)}
          onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
          onTouchEnd={(e) => {
            if (touchX.current === null) return;
            const dx = e.changedTouches[0].clientX - touchX.current;
            if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
            touchX.current = null;
          }}
        >
          <div className="lightbox-bar">
            <span>{open + 1} / {count}</span>
            <button ref={closeRef} type="button" className="lightbox-btn" onClick={() => setOpen(null)} aria-label="Close photo viewer">✕</button>
          </div>
          <img className="lightbox-img" src={imageUrl(photos[open].url, 1800)} alt={`${title} photo ${open + 1}`} onClick={(e) => e.target === e.currentTarget && setOpen(null)} />
          {count > 1 && (
            <>
              <button type="button" className="lightbox-btn lightbox-prev" onClick={() => go(-1)} aria-label="Previous photo">‹</button>
              <button type="button" className="lightbox-btn lightbox-next" onClick={() => go(1)} aria-label="Next photo">›</button>
              <div className="lightbox-thumbs">
                {photos.map((p, i) => (
                  <button key={p.id} type="button" onClick={() => setOpen(i)} aria-label={`Show photo ${i + 1}`} aria-current={i === open ? "true" : undefined} className="lightbox-thumb">
                    <img src={imageUrl(p.url, 160)} alt="" loading="lazy" />
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}
