// ===================================================
// ファイル名: CardModule.jsx
// 作成日: 2026/10/27
// 概要: チャートカード（wxp-card）モジュール。カードごとに表示する指標（複数可）と、
//       指標ごとの表示形式（折れ線 / 面 / 棒 / ゲージ）をレイアウト設定で切り替えられる。
//       折れ線・面・棒は 1 つの時系列チャートに重ねて描き、ゲージはチャートの下に並べる。
//       Y 軸は左右 2 本まで: 最初の単位が左軸、それと違う単位が右軸（metricDefs の axis）。
// ===================================================

import CountUp from "./CountUp";
import TimeSeries from "./TimeSeries";
import WxCard from "./WxCard";

// The Y-range of one side, only when EVERY metric on it has a fixed one.
function sideDomain(rows) {
    if (rows.length === 0 || rows.some((r) => !r.m.domain)) return undefined;
    return [
        Math.min(...rows.map((r) => r.m.domain[0])),
        Math.max(...rows.map((r) => r.m.domain[1])),
    ];
}

/**
 * @param {{title:string|null, metrics:{id:string, style:string}[]}} config
 * @param {Record<string, object>} metrics — buildMetrics().metrics
 * @param {object} chart — buildMetrics().chart (times, viewCount, nowIndex, ...)
 */
export default function CardModule({ config, metrics, chart }) {
    const rows = config.metrics
        .map((r) => ({ m: metrics[r.id], style: r.style }))
        .filter((r) => r.m);
    const plotted = rows.filter((r) => r.style !== "gauge");
    const gauges = rows.filter((r) => r.style === "gauge");

    const firstAxis = plotted[0]?.m.axis;
    const onRight = (r) => r.m.axis !== firstAxis;

    const series = plotted.map(({ m, style }) => ({
        key: m.id,
        label: m.short,
        color: m.color,
        values: m.values,
        unit: m.unit,
        digits: m.digits,
        axis: m.axis === firstAxis ? undefined : "right",
        kind: style === "bar" ? "bar" : undefined,
        opacity: style === "bar" ? m.barOpacity : undefined,
        area: style === "area",
        extrema: style === "area" && m.extrema,
        dashed: style === "line" && m.dashed,
        nonNegative: m.nonNegative,
    }));

    const title = config.title || rows.map((r) => r.m.label).join(" · ");
    // a new set of metrics / styles starts a fresh chart (zoom reset, intro animation)
    const signature = plotted.map((r) => `${r.m.id}:${r.style}`).join("|");

    return (
        <WxCard title={title} className="wxp-card--chart">
            {plotted.length > 0 && (
                <TimeSeries
                    key={signature}
                    times={chart.times}
                    viewCount={chart.viewCount}
                    nowIndex={chart.nowIndex}
                    nowLabel={chart.nowLabel}
                    labels={chart.labels}
                    leftDomain={sideDomain(plotted.filter((r) => !onRight(r)))}
                    rightDomain={sideDomain(plotted.filter(onRight))}
                    series={series}
                />
            )}
            {gauges.length > 0 && (
                <div
                    className={`wxp-gaugelist${plotted.length === 0 ? " wxp-gaugelist--solo" : ""}`}
                >
                    {gauges.map(({ m }) => (
                        <div
                            key={m.id}
                            className="wxp-gaugerow"
                            style={{ "--accent": m.accent }}
                            title={m.hint}
                        >
                            <span className="wxp-gaugerow__label">{m.label}</span>
                            <span className="wxp-gaugerow__value">
                                <CountUp value={m.value} digits={m.digits} />
                                {m.unit && <em>{m.unit}</em>}
                            </span>
                            <div className="wxp-gauge">
                                <i style={{ "--fill": m.gauge ?? 0 }} />
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </WxCard>
    );
}
