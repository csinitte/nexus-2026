'use client';

import { useRef, useState } from 'react';

type Track = { title: string; text: string };

export function TrackGallery({ tracks }: { tracks: Track[] }) {
  const listRef = useRef<HTMLOListElement>(null);
  const [current, setCurrent] = useState(0);
  const [atEnd, setAtEnd] = useState(false);

  function goTo(index: number) {
    const next = Math.max(0, Math.min(index, tracks.length - 1));
    const list = listRef.current;
    const card = list?.children[next] as HTMLElement | undefined;
    if (!list || !card) return;
    list.scrollTo({ left: card.offsetLeft - list.offsetLeft, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
    setCurrent(next);
  }

  function updateCurrent() {
    const list = listRef.current;
    if (!list) return;
    const cards = Array.from(list.children) as HTMLElement[];
    setAtEnd(list.scrollLeft >= list.scrollWidth - list.clientWidth - 2);
    const next = cards.reduce((closest, card, index) =>
      Math.abs(card.offsetLeft - list.offsetLeft - list.scrollLeft) <
      Math.abs(cards[closest].offsetLeft - list.offsetLeft - list.scrollLeft) ? index : closest, 0);
    setCurrent(next);
  }

  return (
    <div className="expo-tracks" aria-label="Project tracks">
      <div className="expo-tracks-header">
        <div><p className="eyebrow">Find your fit</p><h2>Choose your track<span>.</span></h2><p>Pick the area that best matches your project.</p></div>
        <div className="expo-track-controls">
          <span aria-live="polite">{String(current + 1).padStart(2, '0')} / {String(tracks.length).padStart(2, '0')}</span>
          <button type="button" onClick={() => goTo(current - 1)} disabled={current === 0} aria-label="Previous track">←</button>
          <button type="button" onClick={() => goTo(current + 1)} disabled={atEnd || current === tracks.length - 1} aria-label="Next track">→</button>
        </div>
      </div>
      <ol ref={listRef} className="expo-track-list" onScroll={updateCurrent} tabIndex={0} aria-label="Swipe or scroll through the project tracks">
        {tracks.map((track, index) => (
          <li className="expo-track-card" key={track.title}>
            <div className="expo-track-card-top"><span>TRACK {String(index + 1).padStart(2, '0')}</span><span aria-hidden="true">↗</span></div>
            <div className="expo-track-art" aria-hidden="true"><span>{String(index + 1).padStart(2, '0')}</span><i /><i /><i /></div>
            <h3>{track.title}</h3><p>{track.text}</p>
          </li>
        ))}
      </ol>
      <p className="expo-track-hint">SWIPE TO EXPLORE <span aria-hidden="true">→</span></p>
    </div>
  );
}
