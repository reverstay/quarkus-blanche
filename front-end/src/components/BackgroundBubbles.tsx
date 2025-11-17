import { useEffect, useMemo, useRef } from "react";
import "./Bubbles.css";

// util pra número aleatório no intervalo
const rand = (min: number, max: number) => Math.random() * (max - min) + min;

type BubbleVars = {
  left: string;     // ex: "37.2%"
  size: string;     // ex: "22px"
  dur: string;      // ex: "6.2s"
  drift: string;    // ex: "3.0s"
  delay: string;    // ex: "-1.4s" (negativo p/ fase contínua)
  blur: string;     // ex: "0px".."2px"
  px: string;       // parallax x amplitude
  py: string;       // parallax y amplitude
};

export default function BackgroundBubbles({ count = 90 }: { count?: number }) {
  const ref = useRef<HTMLDivElement | null>(null);

  // pré-computa as variáveis “aleatórias” uma única vez
  const items = useMemo(() => {
    const arr: BubbleVars[] = [];
    for (let i = 0; i < count; i++) {
      const left = `${rand(2, 98).toFixed(2)}%`;
      const sizePx = Math.round(rand(12, 42));
      const size = `${sizePx}px`;
      const dur = `${rand(5.0, 7.5).toFixed(2)}s`;
      const drift = `${rand(2.2, 3.6).toFixed(2)}s`;
      const delay = `${(-1 * rand(0, 2.8)).toFixed(2)}s`; // atraso negativo
      const blur = `${rand(0, 2.5).toFixed(1)}px`;
      const px = `${rand(10, 22).toFixed(1)}px`;
      const py = `${rand(6, 14).toFixed(1)}px`;

      arr.push({ left, size, dur, drift, delay, blur, px, py });
    }
    return arr;
  }, [count]);

  // parallax do mouse — atualiza --mx/--my no container
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let raf = 0;
    let tx = 0, ty = 0;
    let x = 0, y = 0;

    const onMove = (e: MouseEvent) => {
      const w = window.innerWidth || 1;
      const h = window.innerHeight || 1;
      tx = (e.clientX / w) * 2 - 1; // -1..1
      ty = (e.clientY / h) * 2 - 1; // -1..1
    };

    const tick = () => {
      x += (tx - x) * 0.08;
      y += (ty - y) * 0.08;
      el.style.setProperty("--mx", x.toFixed(4));
      el.style.setProperty("--my", y.toFixed(4));
      raf = requestAnimationFrame(tick);
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    raf = requestAnimationFrame(tick);
    return () => {
      window.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div className="bg-bubbles" ref={ref} aria-hidden>
      {items.map((v, i) => (
        <span
          key={i}
          className="bubble"
          style={
            {
              "--left": v.left,
              "--size": v.size,
              "--dur": v.dur,
              "--drift": v.drift,
              "--delay": v.delay,
              "--blur": v.blur,
              "--px": v.px,
              "--py": v.py,
            } as React.CSSProperties
          }
        >
          <span className="i" />
        </span>
      ))}
    </div>
  );
}
