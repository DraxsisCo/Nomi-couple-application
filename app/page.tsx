import { NamiPage } from "@/components/nami-page";

export const dynamic = "force-dynamic";

export default async function Home() {
  return <NamiPage initialView="home" />;
}
