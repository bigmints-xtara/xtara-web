import { redirect } from "next/navigation";
import ExploreCareers from "@/components/careers/ExploreCareers";
import { MVP_NAVIGATION_ENABLED } from "@/lib/mvp-navigation";

export default function ExplorePage() {
  if (MVP_NAVIGATION_ENABLED) return <ExploreCareers />;
  redirect("/assessment");
}
