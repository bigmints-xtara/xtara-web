'use client';

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import styles from '../ExploreCareers.module.css';

export function swipeIndex(index: number, distance: number, count: number) {
  return Math.max(0, Math.min(count - 1, index + (Math.abs(distance) >= 40 ? distance < 0 ? 1 : -1 : 0)));
}

export default function VisualCarousel({ items, renderItem, label, previous, next, hint, variant = 'bubble', initialIndex = 0, onFocus }: {
  items: { id: string; title: string }[];
  renderItem: (index: number, active: boolean) => ReactNode;
  label: string; previous: string; next: string; hint: string;
  variant?: 'direction' | 'bubble' | 'fact'; initialIndex?: number;
  onFocus?: (index: number) => void;
}) {
  const [selectedIndex, setIndex] = useState(initialIndex);
  const index = Math.max(0, Math.min(selectedIndex, items.length - 1));
  const [offset, setOffset] = useState(0);
  const [width, setWidth] = useState(800);
  const [factHeight, setFactHeight] = useState(180);
  const viewport = useRef<HTMLDivElement>(null);
  const pagination = useRef<HTMLDivElement>(null);
  const drag = useRef<{ id: number; x: number; y: number; distance: number; horizontal: boolean } | null>(null);
  const suppressClick = useRef(0);
  const focus = (value: number) => { const bounded = Math.max(0, Math.min(items.length - 1, value)); setIndex(bounded); onFocus?.(bounded); };
  useEffect(() => {
    const element = viewport.current;
    if (!element) return;
    const measure = () => setWidth(element.clientWidth || 800);
    measure();
    const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(measure) : null;
    observer?.observe(element);
    return () => observer?.disconnect();
  }, []);
  useEffect(() => {
    if (variant !== 'fact' || !viewport.current) return;
    const slides = Array.from(viewport.current.querySelectorAll('article'));
    const measure = () => setFactHeight(Math.max(180, ...slides.map(slide => slide.scrollHeight)));
    measure();
    const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(measure) : null;
    slides.forEach(slide => observer?.observe(slide));
    return () => observer?.disconnect();
  }, [variant, items]);
  useEffect(() => {
    const dots = pagination.current;
    const activeDot = dots?.children[index] as HTMLElement | undefined;
    if (dots && activeDot) dots.scrollTo?.({ left: activeDot.offsetLeft - dots.offsetLeft - (dots.clientWidth - activeDot.clientWidth) / 2, behavior: 'instant' });
  }, [index]);
  const compact = width <= 700;
  const cardWidth = variant === 'fact' ? Math.min(380, width * .74) : variant === 'bubble' ? Math.min(compact ? 320 : 410, width - 88) : compact ? Math.min(330, width * .77) : Math.max(260, Math.min(360, width * .24));
  const spacing = variant === 'direction' ? cardWidth * (compact ? .94 : .91) : cardWidth + (compact ? 18 : 54);
  const finish = (cancel = false) => {
    const current = drag.current;
    if (!current) return;
    if (current.horizontal) { suppressClick.current = Date.now() + 450; if (!cancel) focus(swipeIndex(index, current.distance, items.length)); }
    drag.current = null; setOffset(0);
  };
  if (!items.length) return null;
  return <section className={`${styles.carousel} ${styles[variant]}`} aria-roledescription="carousel" aria-label={label}>
    <div ref={viewport} className={styles.viewport} style={variant === 'fact' ? { height: factHeight + 24, flex: 'none' } : undefined} data-dragging={offset !== 0 || undefined} tabIndex={0}
      onKeyDown={(event) => { if (event.target !== event.currentTarget) return; if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') { event.preventDefault(); focus(index + (event.key === 'ArrowRight' ? 1 : -1)); } }}
      onPointerDown={(event) => { if (!event.isPrimary || event.button !== 0) return; drag.current = { id: event.pointerId, x: event.clientX, y: event.clientY, distance: 0, horizontal: false }; }}
      onPointerMove={(event) => {
        const current = drag.current; if (!current || current.id !== event.pointerId) return;
        const dx = event.clientX - current.x, dy = event.clientY - current.y;
        if (!current.horizontal && Math.abs(dy) > 9 && Math.abs(dy) > Math.abs(dx)) { drag.current = null; return; }
        if (!current.horizontal && Math.abs(dx) > 7 && Math.abs(dx) > Math.abs(dy)) { current.horizontal = true; event.currentTarget.setPointerCapture?.(event.pointerId); }
        if (current.horizontal) { current.distance = dx; setOffset(dx * ((index === 0 && dx > 0) || (index === items.length - 1 && dx < 0) ? .25 : 1)); }
      }}
      onPointerUp={(event) => { if (drag.current?.id === event.pointerId) finish(); }} onPointerCancel={(event) => { if (drag.current?.id === event.pointerId) finish(true); }} onLostPointerCapture={() => { if (drag.current) finish(true); }}
      onClickCapture={(event) => { if (Date.now() < suppressClick.current) { event.stopPropagation(); event.preventDefault(); } }}>
      {items.map((item, i) => {
        const relative = i - index + offset / spacing, depth = Math.abs(relative), active = i === index;
        const yaw = variant === 'direction' && !compact ? Math.max(-20, Math.min(20, relative * -9)) : 0;
        const rotation = variant === 'direction' && !compact ? Math.max(-5, Math.min(5, relative * 2.2)) : 0;
        const transform = `translate(-50%, -50%) translate3d(${relative * spacing}px, ${variant === 'direction' ? Math.min(depth * depth * 8, 80) : 0}px, 0) rotateY(${yaw}deg) rotateZ(${rotation}deg) scale(${variant === 'direction' ? Math.max(.72, 1 - depth * .065) : 1})`;
        return <article key={item.id} className={`${styles.slide} ${active ? styles.active : ''}`} data-active={active} aria-roledescription="slide" aria-label={`${i + 1} / ${items.length}: ${item.title}`}
          style={{ width: cardWidth, transform, zIndex: 20 - Math.min(19, Math.round(depth)), opacity: depth > 4 ? 0 : variant === 'fact' && !active ? .42 : 1, pointerEvents: depth > 4 ? 'none' : undefined } as CSSProperties}
          onClick={() => { if (!active) focus(i); }}>
          {!active && <button className={styles.focusTarget} aria-label={`${label}: ${item.title}`} tabIndex={-1} onClick={() => focus(i)} />}
          {renderItem(i, active)}
        </article>;
      })}
    </div>
    {items.length > 1 && <div className={styles.controls}>
      <button aria-label={previous} disabled={index === 0} onClick={() => focus(index - 1)}><ArrowLeft size={20} /></button>
      <div ref={pagination} className={styles.dots}>{items.map((item, i) => <button key={item.id} aria-label={`${item.title}: ${i + 1} / ${items.length}`} aria-current={i === index ? 'true' : undefined} onClick={() => focus(i)}><span /></button>)}</div>
      <button aria-label={next} disabled={index === items.length - 1} onClick={() => focus(index + 1)}><ArrowRight size={20} /></button>
    </div>}
    <p className={styles.hint} aria-live="polite">{hint}{items.length > 1 ? ` · ${index + 1} / ${items.length}` : ''}</p>
  </section>;
}
