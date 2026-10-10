import { BrowsePage } from "@/components/BrowsePage";

export const metadata = { title: "Houses for sale" };

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  return <BrowsePage category="house" sp={await searchParams} />;
}
