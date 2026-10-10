import { BrowsePage } from "@/components/BrowsePage";

export const metadata = { title: "Car rentals" };

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  return <BrowsePage category="car" sp={await searchParams} />;
}
