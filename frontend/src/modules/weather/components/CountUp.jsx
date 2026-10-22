// ===================================================
// ファイル名: CountUp.jsx
// 作成日: 2026/10/22
// 概要: 数値が 0 から目標値までカウントアップするアニメーション表示
//       値が変わったとき（単位切替・更新）は現在表示値から短く追従する。
//       値が無い（null）ときは "--"。
// ===================================================

import { useEffect, useRef, useState } from "react";

const ease = (t) => 1 - (1 - t) ** 3;

export default function CountUp({ value, digits = 0, duration = 1000 }) {
    const [shown, setShown] = useState(Number.isFinite(value) ? 0 : null);
    const from = useRef(0);
    const first = useRef(true);

    useEffect(() => {
        if (!Number.isFinite(value)) {
            setShown(null);
            return undefined;
        }
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
            from.current = value;
            setShown(value);
            return undefined;
        }

        const ms = first.current ? duration : duration / 2;
        first.current = false;
        const a = from.current;
        const t0 = performance.now();
        let raf;
        const tick = (now) => {
            const t = Math.min(1, (now - t0) / ms);
            const v = a + (value - a) * ease(t);
            from.current = v;
            setShown(v);
            if (t < 1) raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(raf);
    }, [value, duration]);

    return <>{shown === null ? "--" : shown.toFixed(digits)}</>;
}
