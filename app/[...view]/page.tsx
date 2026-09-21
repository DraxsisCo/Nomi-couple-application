import { NamiPage } from "@/components/nami-page";
import type { Tab } from "@/lib/types";
import { notFound } from "next/navigation";

const routes = new Map<string, Tab>([
  ["us", "us"],
  ["plans", "plans"],
  ["memories", "memories"],
  ["profile", "profile"],
  ["profile/cycle", "cycle"],
]);

export default async function AppViewPage({ params }: { params: Promise<{ view: string[] }> }) {
  const key = (await params).view.join("/");
  const initialView = routes.get(key);
  if (!initialView) notFound();
  return <NamiPage initialView={initialView} />;
}
