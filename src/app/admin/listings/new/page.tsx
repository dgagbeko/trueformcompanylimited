import Link from "next/link";
import { ListingForm } from "@/components/admin/ListingForm";

export default function NewListing() {
  return (
    <>
      <div className="stack" style={{ gap: 6 }}>
        <Link href="/admin/listings" style={{ fontSize: 14 }}>← All listings</Link>
        <h1 className="display" style={{ fontSize: 32 }}>New listing</h1>
      </div>
      <ListingForm />
    </>
  );
}
