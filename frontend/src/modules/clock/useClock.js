// ===================================================
// ファイル名: useClock.js
// 概要: 現在時刻を返すフック。秒(または分)の境目に合わせて更新するので
//       setInterval のようなズレが蓄積せず、表示が実時刻から遅れない。
// ===================================================

import { useEffect, useState } from "react";

export default function useClock(showSeconds = true) {
    const [now, setNow] = useState(() => new Date());

    useEffect(() => {
        let timer;
        const step = showSeconds ? 1000 : 60 * 1000;

        const schedule = () => {
            const current = new Date();
            const elapsed = showSeconds
                ? current.getMilliseconds()
                : current.getSeconds() * 1000 + current.getMilliseconds();
            // +5ms so we land just past the boundary instead of just before it.
            timer = setTimeout(
                () => {
                    setNow(new Date());
                    schedule();
                },
                step - elapsed + 5,
            );
        };

        setNow(new Date());
        schedule();
        return () => clearTimeout(timer);
    }, [showSeconds]);

    return now;
}
