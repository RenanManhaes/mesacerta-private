import { useEffect, useRef } from 'react';

/** Original platform canvas, with resize and lifecycle cleanup. */
export default function AuthTables() {
  const ref = useRef(null);
  useEffect(() => {
    const canvas = ref.current;
    const context = canvas.getContext('2d');
    if (!context) return;
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    let frame = 0, width = 0, height = 0, time = 0, previous = 0;
    const draw = (timestamp = 0) => {
      if (previous && !media.matches) time += Math.min(timestamp - previous, 50) * .0006;
      previous = timestamp;
      context.clearRect(0, 0, width, height);
      for (let i = 0; i < 9; i++) {
        const x = (i % 3 + .5) / 3 * width;
        const y = (Math.floor(i / 3) + .5) / 3 * height * .7 + 30;
        context.strokeStyle = 'rgba(255,255,255,.18)';
        context.lineWidth = 1.5;
        context.beginPath();
        context.roundRect(x - 34, y - 18, 68, 36, 10);
        context.stroke();
        for (let seat = 0; seat < 6; seat++) {
          const angle = seat / 6 * Math.PI * 2 + time * (i % 2 ? 1 : -1) * .4;
          context.fillStyle = (Math.sin(time * 3 + i + seat) + 1) / 2 > .8 ? '#e8663d' : 'rgba(255,255,255,.55)';
          context.beginPath();
          context.arc(x + Math.cos(angle) * 52, y + Math.sin(angle) * 32, 5, 0, Math.PI * 2);
          context.fill();
        }
      }
      if (!media.matches && width && height && !document.hidden) frame = requestAnimationFrame(draw);
    };
    const restart = () => {
      cancelAnimationFrame(frame);
      previous = 0;
      const bounds = canvas.getBoundingClientRect();
      width = bounds.width;
      height = bounds.height;
      const ratio = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      draw();
    };
    const observer = new ResizeObserver(restart);
    observer.observe(canvas);
    media.addEventListener('change', restart);
    document.addEventListener('visibilitychange', restart);
    restart();
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      media.removeEventListener('change', restart);
      document.removeEventListener('visibilitychange', restart);
    };
  }, []);
  return <canvas ref={ref} className="platform-auth-tables" aria-hidden="true" />;
}
