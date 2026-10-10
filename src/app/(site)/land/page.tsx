import { BrowsePage } from "@/components/BrowsePage";

export const metadata = { title: "Land for sale" };

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  return <BrowsePage category="land" sp={await searchParams} />;
}
