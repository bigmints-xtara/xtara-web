'use client';

import Image from 'next/image';
import { useState, type CSSProperties } from 'react';
import { ImageIcon } from 'lucide-react';
import type { ExplorerIllustration } from '@/types/career-explorer';
import styles from '../ExploreCareers.module.css';

export function safeSourceUrl(url: string) { try { const value = new URL(url); return ['https:', 'http:'].includes(value.protocol) ? value.href : null; } catch { return null; } }

export function ExplorerScene({ illustration, placeholder, bubble = false, decorative = false, sizes = "(max-width:700px) 80vw, 410px" }: { illustration?: ExplorerIllustration; placeholder: string; bubble?: boolean; decorative?: boolean; sizes?: string }) {
  const [failedUrl, setFailedUrl] = useState<string>();
  const url = illustration && safeSourceUrl(illustration.url);
  return <div className={`${styles.media} ${bubble ? styles.bubbleMedia : ''}`}>
    {url && url !== failedUrl ? <Image unoptimized fill sizes={sizes} src={url} alt={decorative ? '' : illustration?.alt ?? ''} draggable={false} onError={() => setFailedUrl(url)} /> : <span className={styles.placeholder} aria-hidden={decorative || undefined}><ImageIcon size={34} strokeWidth={1.2} aria-hidden="true" />{!decorative && <span>{placeholder}</span>}</span>}
  </div>;
}
export const explorerTone = (presentation?: { accent: string; tint: string; wash: string; washEnd: string }) => presentation ? ({ '--scene-accent': presentation.accent, '--scene-tint': presentation.tint, '--scene-wash': presentation.wash, '--scene-wash-end': presentation.washEnd } as CSSProperties) : undefined;
