import Header from "@/components/Header";

export default function OrganizationLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-svh bg-background text-foreground"><Header />{children}</div>;
}
