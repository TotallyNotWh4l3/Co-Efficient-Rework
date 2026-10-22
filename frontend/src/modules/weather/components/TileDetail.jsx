// ===================================================
// ファイル名: TileDetail.jsx
// 作成日: 2026/10/22
// 概要: 計器タイルをクリックしたときに開く拡大ビュー
//       大きな現在値・説明・期間内の最小/平均/最大・拡大チャート（ズーム/系列切替可）
// ===================================================

import { useEffect } from "react";
import { X } from "lucide-react";

import TimeSeries from "./TimeSeries";
import CountUp from "./CountUp";

/**
 * @param {{title, value, unit, hint, series, times, nowIndex, domain?, digits?}} detail
 */
export default function TileDetail({ detail, T, onClose }) {
    useEffect(() => {
        const onKey = (e) => e.key === "Escape" && onClose();
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [onClose]);

    const main = detail.series[0];
    const finite = main.values.filter(Number.isFinite);
    const digits = main.digits ?? 0;
    const stat = (v) => <CountUp value={v} digits={digits} />;
    const min = finite.length ? Math.min(...finite) : null;
    const max = finite.length ? Math.max(...finite) : null;
    const mean = finite.length ? finite.reduce((a, b) => a + b, 0) / finite.length : null;

    return (
        <div className="wxp-modal" onClick={onClose} role="dialog" aria-modal="true">
            <div className="wxp-modal__box" onClick={(e) => e.stopPropagation()}>
                <header className="wxp-modal__head">
                    <h3>{detail.title}</h3>
                    <button className="wxp-icon-btn" onClick={onClose} aria-label={T.close}>
                        <X size={14} />
                    </button>
                </header>

                <div className="wxp-modal__now">
                    <CountUp value={detail.value} digits={digits} />
                    {detail.unit && <span>{detail.unit}</span>}
                </div>

                <p className="wxp-modal__hint">{detail.hint}</p>

                <dl className="wxp-modal__stats">
                    <div>
                        <dt>{T.min}</dt>
                        <dd>{stat(min)}</dd>
                    </div>
                    <div>
                        <dt>{T.mean}</dt>
                        <dd>{stat(mean)}</dd>
                    </div>
                    <div>
                        <dt>{T.max}</dt>
                        <dd>{stat(max)}</dd>
                    </div>
                </dl>

                <div className="wxp-modal__chart">
                    <TimeSeries
                        times={detail.times}
                        nowIndex={detail.nowIndex}
                        nowLabel={detail.nowLabel}
                        leftDomain={detail.domain}
                        rightDomain={detail.rightDomain}
                        series={detail.series}
                        labels={T.chart}
                    />
                </div>
            </div>
        </div>
    );
}