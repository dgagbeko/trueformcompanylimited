import Link from "next/link";

export function Brand() {
  return (
    <Link href="/" className="brand" aria-label="TrueForm Excellence home">
      <span className="brand-mark" aria-hidden="true">tf</span>
      <span className="brand-name" aria-hidden="true">
        <b>trueform</b>
        <small>EXCELLENCE</small>
      </span>
    </Link>
  );
}
