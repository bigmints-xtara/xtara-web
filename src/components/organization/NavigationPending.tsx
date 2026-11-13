"use client";
import { useLinkStatus } from "next/link";
import { Loader2 } from "lucide-react";
import { useTranslations } from "@/i18n/language-provider";

export default function NavigationPending() {
  const { pending } = useLinkStatus();
  const { t } = useTranslations();
  return pending ? <span role="status" className="ml-2 inline-flex items-center"><Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" /><span className="sr-only">{t("organizationNavigation.opening")}</span></span> : null;
}
