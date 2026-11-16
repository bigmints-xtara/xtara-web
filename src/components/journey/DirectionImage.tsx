"use client";

import CareerDirectionArtwork from './CareerDirectionArtwork';
import styles from "./journey.module.css";

/** Canonical Explorer artwork; adjacent direction heading supplies its meaning. */
export default function DirectionImage({ directionId, sizes = "(max-width: 799px) 100vw, 600px" }: { directionId: string; sizes?: string }) {
  return <div className={styles.directionImage}><CareerDirectionArtwork directionId={directionId} width={600} height={360} sizes={sizes} /></div>;
}
