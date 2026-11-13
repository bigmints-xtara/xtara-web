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
  const compact = width <= 700;
  const loop = variant === 'direction' && !compact && items.length > 1;
  const [factHeight, setFactHeight] = useState(180);
  const viewport = useRef<HTMLDivElement>(null);
  const drag = useRef<{ id: number; x: number; y: number; distance: number; horizontal: boolean } | null>(null);
  const suppressClick = useRef(0);
  const focus = (value: number) => { const bounded = loop ? ((value % items.length) + items.length) % items.length : Math.max(0, Math.min(items.length - 1, value)); setIndex(bounded); onFocus?.(bounded); };
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
  // Facts are reading panels, not previews: keep the entire paragraph in view.
  const cardWidth = variant === 'fact' ? Math.min(550, Math.max(0, width - 32)) : variant === 'bubble' ? Math.min(compact ? 320 : 370, width - 88) : compact ? Math.min(400, width - 64) : Math.max(260, Math.min(360, width * .24));
  const spacing = variant === 'direction' ? compact ? cardWidth + 14 : cardWidth * .98 : cardWidth + (compact ? 12 : 54);
  const finish = (cancel = false) => {
    const current = drag.current;
    if (!current) return;
    if (current.horizontal) { suppressClick.current = Date.now() + 450; if (!cancel) focus(loop ? index + (Math.abs(current.distance) >= 40 ? current.distance < 0 ? 1 : -1 : 0) : swipeIndex(index, current.distance, items.length)); }
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
        if (current.horizontal) { current.distance = dx; setOffset(dx * (!loop && ((index === 0 && dx > 0) || (index === items.length - 1 && dx < 0)) ? .25 : 1)); }
      }}
      onPointerUp={(event) => { if (drag.current?.id === event.pointerId) finish(); }} onPointerCancel={(event) => { if (drag.current?.id === event.pointerId) finish(true); }} onLostPointerCapture={() => { if (drag.current) finish(true); }}
      onClickCapture={(event) => { if (Date.now() < suppressClick.current) { event.stopPropagation(); event.preventDefault(); } }}>
      {items.map((item, i) => {
        const distance = loop ? ((i - index + items.length / 2 + items.length) % items.length) - items.length / 2 : i - index;
        const relative = distance + offset / spacing, depth = Math.abs(relative), active = i === index;
        const yaw = variant === 'direction' && !compact ? Math.max(-26, Math.min(26, relative * -12)) : 0;
        const rotation = variant === 'direction' && !compact ? Math.max(-6, Math.min(6, relative * 2)) : 0;
        const translation = variant === 'fact' ? Math.max(-12, Math.min(12, relative * spacing)) : relative * spacing;
        const hiddenFact = variant === 'fact' && !active;
        const transform = `translate(-50%, -50%) translate3d(${translation}px, ${variant === 'direction' && !compact ? Math.min(depth * depth * 7, 65) : 0}px, 0) rotateY(${yaw}deg) rotateZ(${rotation}deg) scale(${variant === 'direction' && !compact ? Math.max(.7375, 1 - depth * .075) : 1})`;
        return <article key={item.id} className={`${styles.slide} ${active ? styles.active : ''}`} data-active={active} aria-hidden={hiddenFact || undefined} inert={hiddenFact || undefined} aria-roledescription="slide" aria-label={`${i + 1} / ${items.length}: ${item.title}`}
          style={{ width: cardWidth, transform, zIndex: 20 - Math.min(19, Math.round(depth)), opacity: depth > 4 || hiddenFact ? 0 : 1, pointerEvents: depth > 4 || hiddenFact ? 'none' : undefined } as CSSProperties}
          onClick={() => { if (!active) focus(i); }}>
          {!active && <button className={styles.focusTarget} aria-label={`${label}: ${item.title}`} tabIndex={-1} onClick={() => focus(i)} />}
          {renderItem(i, active)}
        </article>;
      })}
    </div>
    {items.length > 1 && <div className={styles.controls}>
      <button aria-label={previous} disabled={!loop && index === 0} onClick={() => focus(index - 1)}><ArrowLeft size={20} /></button>
      <span className={styles.position} aria-live="polite" aria-atomic="true">{index + 1} / {items.length}</span>
      <button aria-label={next} disabled={!loop && index === items.length - 1} onClick={() => focus(index + 1)}><ArrowRight size={20} /></button>
    </div>}
    {items.length > 1 && hint && <p className={styles.hint}>{hint}</p>}
  </section>;
}
