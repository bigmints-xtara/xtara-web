import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Locale } from "@/i18n/config";
import { directionOverviewCopy } from "@/lib/direction-overview-copy";
import { mvpNavigationCopy } from "@/lib/mvp-navigation";
import styles from "./DashboardExploreBanner.module.css";

export default function DashboardExploreBanner({ locale }: { locale: Locale }) {
  const navigation = mvpNavigationCopy[locale];
  return (
    <section className={styles.banner} aria-labelledby="dashboard-explore-title">
      <div className={styles.copy}>
        <h2 id="dashboard-explore-title">{directionOverviewCopy[locale].explore}</h2>
        <p>{navigation.description}</p>
        <Button asChild size="lg" className="h-auto min-h-11 max-w-full rounded-full text-start whitespace-normal">
          <Link href="/explore">{navigation.exploreCareers}<ArrowRight aria-hidden="true" /></Link>
        </Button>
      </div>
      <div className={styles.field} aria-hidden="true">
        <div className={styles.scene}>
          <Image unoptimized src="/images/explorer-guide/art.webp" alt="" width={344} height={350} className={styles.art} />
          <Image unoptimized src="/images/explorer-guide/digital.webp" alt="" width={350} height={345} className={styles.digital} />
          <Image unoptimized src="/images/explorer-guide/science.webp" alt="" width={350} height={350} className={styles.science} />
        </div>
      </div>
    </section>
  );
}
