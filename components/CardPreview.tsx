import React, { useEffect, useRef, useState } from 'react';
import { Military } from '../types';
import BirthdayCard from './BirthdayCard';

interface CardPreviewProps {
  soldier?: Military;
  soldiers?: Military[];
  /** Largura máxima em px (o cartão real tem 595 × 842) */
  maxWidth?: number;
  /** id aplicado ao cartão em tamanho real (usado na impressão) */
  id?: string;
}

const CARD_W = 595;
const CARD_H = 842;

/** Mostra o cartão em escala, ajustando à largura disponível */
const CardPreview: React.FC<CardPreviewProps> = ({ soldier, soldiers, maxWidth = CARD_W, id }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.5);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = (w: number) => setScale(Math.min(1, Math.max(0.2, w / CARD_W)));
    update(el.clientWidth);
    const ro = new ResizeObserver((entries) => update(entries[0].contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div ref={ref} className="mx-auto w-full" style={{ maxWidth }}>
      <div
        className="print-reset relative overflow-hidden rounded-md shadow-2xl shadow-stone-900/20 ring-1 ring-black/5"
        style={{ width: CARD_W * scale, height: CARD_H * scale }}
      >
        <div
          className="print-reset"
          style={{ transform: `scale(${scale})`, transformOrigin: 'top left', width: CARD_W, height: CARD_H }}
        >
          <div id={id}>
            {soldiers && soldiers.length > 0 ? <BirthdayCard soldiers={soldiers} /> : <BirthdayCard soldier={soldier} />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CardPreview;
