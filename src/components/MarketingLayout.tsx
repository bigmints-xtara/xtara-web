import type { ReactNode } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

import styles from '@/components/journey/journey.module.css';

interface MarketingLayoutProps {
  children: ReactNode;
}

const MarketingLayout = ({ children }: MarketingLayoutProps) => {
  return (
    <div className={styles.surface}>
      <Header />
      <main>{children}</main>
      <Footer />
    </div>
  );
};

export default MarketingLayout;
