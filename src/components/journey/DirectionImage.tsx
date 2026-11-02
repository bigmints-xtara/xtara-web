"use client";

import Image from "next/image";
import { useState } from "react";
import { getCareerDirectionImage } from "@/lib/career-direction-imagery";
import styles from "./journey.module.css";

/** Existing editorial imagery; adjacent direction heading supplies its meaning. */
export default function DirectionImage({ directionId, sizes = "(max-width: 799px) 100vw, 600px" }: { directionId: string; sizes?: string }) {
  const src = getCareerDirectionImage(directionId);
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  if (!src || failedSrc === src) return null;
  return <div className={styles.directionImage}><Image src={src} alt="" fill sizes={sizes} onError={() => setFailedSrc(src)} /></div>;
}
