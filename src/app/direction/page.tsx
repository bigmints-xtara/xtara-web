import { redirect } from "next/navigation";

export default function LegacyDirectionPage() {
  redirect("/dashboard#next-steps");
}
