'use client';

import Image from 'next/image';
import { useState, type ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Compass } from 'lucide-react';
import { useTranslations } from '@/i18n/language-provider';
import { getCareerExplorer } from '@/lib/career-explorer-api';
import { getCareerDirectionIllustration } from '@/lib/career-direction-imagery';

/** Shares Explorer's locale-scoped public query and immutable published image URLs. */
export default function CareerDirectionArtwork({ directionId, width = 240, height = 180, sizes, className, decorative = true, fallback }: {
  directionId: string;
  width?: number;
  height?: number;
  sizes?: string;
  className?: string;
  decorative?: boolean;
  fallback?: ReactNode;
}) {
  const { locale } = useTranslations();
  const { data } = useQuery({
    queryKey: ['career-explorer', locale],
    queryFn: ({ signal }) => getCareerExplorer(locale, signal),
    meta: { authScope: 'public' },
    staleTime: 60_000,
    retry: false,
  });
  const illustration = getCareerDirectionIllustration(data?.directions, directionId);
  const [failedUrl, setFailedUrl] = useState<string>();
  if (!illustration || failedUrl === illustration.url) {
    return fallback ?? <div aria-hidden="true" className={className} style={{ aspectRatio: `${width}/${height}`, display: 'grid', placeItems: 'center' }}><Compass size={48} /></div>;
  }
  return <Image unoptimized src={illustration.url} alt={decorative ? '' : illustration.alt} width={width} height={height} sizes={sizes} className={className} style={{ objectFit: 'contain' }} onError={() => setFailedUrl(illustration.url)} />;
}
