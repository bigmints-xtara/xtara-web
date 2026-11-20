'use client';

import Image from 'next/image';
import { useState, type CSSProperties } from 'react';
import { ImageIcon, GitBranch } from 'lucide-react';
import type { ExplorerIllustration } from '@/types/career-explorer';
import styles from '../ExploreCareers.module.css';

import { safeSourceUrl } from './career-artwork';
export { safeSourceUrl } from './career-artwork';

export function ExplorerScene({ illustration, placeholder, bubble = false, decorative = false, contextTitle, contextShown = false, sizes = "(max-width:700px) 80vw, 410px" }: { illustration?: ExplorerIllustration; placeholder: string; bubble?: boolean; decorative?: boolean; contextTitle?: string; contextShown?: boolean; sizes?: string }) {
  const [failedUrl, setFailedUrl] = useState<string>();
  const url = illustration && safeSourceUrl(illustration.url);
  return <div className={`${styles.media} ${bubble ? styles.bubbleMedia : ''}`}>
    {url && url !== failedUrl ? <Image unoptimized fill sizes={sizes} src={url} alt={decorative ? '' : illustration?.alt ?? ''} draggable={false} onError={() => setFailedUrl(url)} /> : contextShown ?
      <span className={styles.placeholder} aria-hidden="true"><GitBranch size={30} strokeWidth={1.2} /></span> :
      <span className={styles.placeholder} aria-hidden={decorative || undefined}><ImageIcon size={34} strokeWidth={1.2} aria-hidden="true" />{!decorative && <span>{placeholder}</span>}</span>}
    {url && url !== failedUrl && contextTitle && <span className={styles.artworkSource}>{contextTitle}</span>}
  </div>;
}
export const explorerTone = (presentation?: { accent: string; tint: string; wash: string; washEnd: string }) => presentation ? ({ '--scene-accent': presentation.accent, '--scene-tint': presentation.tint, '--scene-wash': presentation.wash, '--scene-wash-end': presentation.washEnd } as CSSProperties) : undefined;
