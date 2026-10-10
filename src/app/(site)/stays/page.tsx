import { BrowsePage } from "@/components/BrowsePage";

export const metadata = { title: "Short stays" };

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  return <BrowsePage category="stay" sp={await searchParams} />;
}
