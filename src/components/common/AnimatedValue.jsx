import React, { useEffect, useState } from 'react';

/** Anima somente a apresentação. O valor final vem dos seletores do produto.
 * @param {{value: number, format?: (value: number) => string, className?: string}} props
 */
export default function AnimatedValue({ value, format = number => Math.round(number).toLocaleString('pt-BR'), className }) {
  const [reducedMotion, setReducedMotion] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const updatePreference = () => setReducedMotion(media.matches);
    updatePreference();
    media.addEventListener('change', updatePreference);
    return () => media.removeEventListener('change', updatePreference);
  }, []);
  useEffect(() => {
    if (reducedMotion) { setDisplay(value); return; }
    let frame;
    const start = performance.now();
    const tick = now => {
      const progress = Math.max(0, Math.min(1, (now - start) / 900));
      setDisplay(value * (1 - Math.pow(1 - progress, 3)));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value, reducedMotion]);
  const finalValue = format(value);
  return <span className={className} aria-label={finalValue}><span aria-hidden="true">{format(reducedMotion ? value : display)}</span></span>;
}
