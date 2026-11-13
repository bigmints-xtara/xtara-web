import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import VisualCarousel, { swipeIndex } from './VisualCarousel';
afterEach(cleanup);
describe('touch carousel', () => {
  it.each([320, 700, 980])('keeps one complete fact readable at %ipx, including the middle slide', (width) => {
    const measure = vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(width);
    try {
      const { container } = render(<VisualCarousel variant="fact" items={[{id:'a',title:'One'},{id:'b',title:'Two'},{id:'c',title:'Three'}]} label="Work" previous="Previous" next="Next" hint="" renderItem={i => <p>Complete fact {i}</p>} />);
      const slides = Array.from(container.querySelectorAll('article'));
      const check = (index: number) => {
        expect(screen.getAllByRole('article')).toHaveLength(1);
        slides.forEach((slide, i) => {
          expect(parseFloat(slide.style.width)).toBeLessThanOrEqual(width - 32);
          expect(slide.style.opacity).toBe(i === index ? '1' : '0');
          if (i !== index) expect(slide).toHaveAttribute('inert');
        });
      };
      check(0);
      fireEvent.click(screen.getByRole('button', {name:'Next'}));
      check(1);
      expect(screen.getByRole('article')).toHaveTextContent('Complete fact 1');
      fireEvent.keyDown(container.querySelector('[tabindex="0"]')!, {key:'ArrowRight'});
      check(2);
      expect(screen.getByRole('button', {name:'Next'})).toBeDisabled();
    } finally { measure.mockRestore(); }
  });

  it('snaps horizontal drags one slide and clamps first/last boundaries', () => {
    expect(swipeIndex(0, -100, 3)).toBe(1);
    expect(swipeIndex(1, 100, 3)).toBe(0);
    expect(swipeIndex(0, 100, 3)).toBe(0);
    expect(swipeIndex(2, -100, 3)).toBe(2);
    expect(swipeIndex(1, -20, 3)).toBe(1);
  });
  it('supports keyboard navigation and exactly one focused action', () => {
    const { container } = render(<VisualCarousel items={[{ id:'a',title:'One' },{ id:'b',title:'Two' }]} label="Careers" previous="Previous" next="Next" hint="Swipe" renderItem={(i,active) => <button tabIndex={active ? 0 : -1}>Open {i}</button>} />);
    fireEvent.keyDown(container.querySelector('[tabindex="0"]')!, { key:'ArrowRight' });
    expect(screen.getByRole('button',{name:'Next'})).toBeDisabled();
    expect(screen.getByRole('button',{name:'Open 1'})).toHaveAttribute('tabindex','0');
    expect(screen.getByRole('button',{name:'Previous'})).not.toBeDisabled();
  });
  it('wraps the desktop direction deck so both neighboring directions remain reachable', () => {
    render(<VisualCarousel variant="direction" items={[{id:'a',title:'One'},{id:'b',title:'Two'},{id:'c',title:'Three'}]} label="Directions" previous="Previous" next="Next" hint="Swipe" renderItem={(i,active) => <button tabIndex={active ? 0 : -1}>Open {i}</button>} />);
    expect(screen.getByRole('button',{name:'Previous'})).not.toBeDisabled();
    fireEvent.click(screen.getByRole('button',{name:'Previous'}));
    expect(screen.getByRole('button',{name:'Open 2'})).toHaveAttribute('tabindex','0');
    fireEvent.click(screen.getByRole('button',{name:'Next'}));
    expect(screen.getByRole('button',{name:'Open 0'})).toHaveAttribute('tabindex','0');
  });
  it('does not ask the learner to swipe when there is only one choice', () => {
    render(<VisualCarousel items={[{id:'a',title:'One'}]} label="Careers" previous="Previous" next="Next" hint="Swipe or drag to discover" renderItem={() => <p>Only career</p>} />);
    expect(screen.queryByText('Swipe or drag to discover')).not.toBeInTheDocument();
    expect(screen.queryByRole('button',{name:'Next'})).not.toBeInTheDocument();
  });
  it('follows a finger drag, snaps on release and suppresses the resulting click', () => {
    const open = vi.fn();
    const { container } = render(<VisualCarousel items={[{id:'a',title:'One'},{id:'b',title:'Two'}]} label="Careers" previous="Previous" next="Next" hint="Swipe" renderItem={i => <button onClick={open}>Open {i}</button>} />);
    const viewport = container.querySelector('[tabindex="0"]')!;
    const pointer = (type: string, x: number, y = 20) => {
      const event = new MouseEvent(type, { bubbles:true, clientX:x, clientY:y, button:0 });
      Object.defineProperties(event, { pointerId:{value:1}, isPrimary:{value:true} });
      fireEvent(viewport,event);
    };
    pointer('pointerdown',200);
    pointer('pointermove',110);
    expect(viewport).toHaveAttribute('data-dragging','true');
    pointer('pointerup',110);
    expect(screen.getByRole('button',{name:'Next'})).toBeDisabled();
    fireEvent.click(screen.getByRole('button',{name:'Open 1'}));
    expect(open).not.toHaveBeenCalled();
    expect(viewport).not.toHaveAttribute('data-dragging');
  });
  it('restores the starting slide after cancellation and leaves vertical gestures alone', () => {
    const { container } = render(<VisualCarousel items={[{id:'a',title:'One'},{id:'b',title:'Two'}]} label="Careers" previous="Previous" next="Next" hint="Swipe" renderItem={i => <span>{i}</span>} />);
    const viewport = container.querySelector('[tabindex="0"]')!;
    const pointer = (type: string, x: number, y: number) => {
      const event = new MouseEvent(type,{bubbles:true,clientX:x,clientY:y,button:0});
      Object.defineProperties(event,{pointerId:{value:1},isPrimary:{value:true}});
      fireEvent(viewport,event);
    };
    pointer('pointerdown',200,20); pointer('pointermove',100,25); pointer('pointercancel',100,25);
    expect(screen.getByRole('button',{name:'Previous'})).toBeDisabled();
    pointer('pointerdown',200,20); pointer('pointermove',190,80); pointer('pointerup',100,90);
    expect(screen.getByRole('button',{name:'Previous'})).toBeDisabled();
    expect(viewport).not.toHaveAttribute('data-dragging');
  });
});
