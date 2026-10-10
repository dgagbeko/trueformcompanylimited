/** Ask Cloudinary for a resized, auto-compressed rendition of an image URL. Other URLs pass through. */
export function imageUrl(url: string, width: number) {
  if (!url.includes("res.cloudinary.com") || !url.includes("/image/upload/")) return url;
  return url.replace("/image/upload/", `/image/upload/f_auto,q_auto,c_limit,w_${width}/`);
}
