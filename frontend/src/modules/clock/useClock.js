// ===================================================
// ファイル名: useClock.js
// 概要: 現在時刻を返すフック。時刻はサーバー基準に補正されるので、端末の時計が
//       ずれていても正しい時刻を表示する(serverClock.js を参照)。
//       秒(または分)の境目に合わせて更新するので、setInterval のような
//       ズレが蓄積せず、表示が実時刻から遅れない。
// ===================================================

import { useEffect, useState } from "react";
import {
    getServerNow,
    startServerClockSync,
    subscribeServerClock,
} from "../../shared/utils/serverClock";

export default function useClock(showSeconds = true) {
    const [now, setNow] = useState(() => getServerNow());

    useEffect(() => {
        startServerClockSync();

        let timer;
        const step = showSeconds ? 1000 : 60 * 1000;

        const schedule = () => {
            clearTimeout(timer);
            const current = getServerNow();
            const elapsed = showSeconds
                ? current.getMilliseconds()
                : current.getSeconds() * 1000 + current.getMilliseconds();
            // +5ms so we land just past the boundary instead of just before it.
            timer = setTimeout(
                () => {
                    setNow(getServerNow());
                    schedule();
                },
                step - elapsed + 5,
            );
        };

        setNow(getServerNow());
        schedule();

        // When a sync corrects the offset, jump to the right time immediately
        // and re-align the boundary timer.
        const unsubscribe = subscribeServerClock(() => {
            setNow(getServerNow());
            schedule();
        });

        return () => {
            clearTimeout(timer);
            unsubscribe();
        };
    }, [showSeconds]);

    return now;
}
