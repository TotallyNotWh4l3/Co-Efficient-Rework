// ===================================================
// ファイル名: weatherLayout.js
// 作成日: 2026/10/27
// 概要: 天気ページのモジュール配置モデル（純粋関数のみ）
//       ダッシュボードと同じ「セルのグリッド」方式。各モジュールは col / row（左上のセル）と
//       w / h（セル数）を持つ。配置の衝突判定は共有の shared/utils/grid.js (canPlaceAt) を使う。
//       レイアウトはユーザー設定 preferences.weatherLayout に保存され、
//       無い／壊れている場合は DEFAULT_LAYOUT（従来の固定レイアウトと同じ見た目）になる。
// ===================================================

import { canPlaceAt } from "../../../../../shared/utils/grid";
import {
    CARD_STYLES,
    MAX_CARD_METRICS,
    METRIC_DEFS,
    METRIC_IDS,
    TILE_DISPLAYS,
    TILE_SUB_DEFAULT,
    TILE_SUB_NONE,
    cardAxesFit,
    isMetricId,
} from "../metrics/metricDefs";
import { isHexColor, sanitizeGraphOverride } from "../utils/graphStyle";

export const LAYOUT_VERSION = 1;
export const GRID = { columns: 18, rows: 18 };

// tile / card are configurable and can exist many times. The others are
// single-instance cards (id === type) with no options yet.
export const MULTI_TYPES = ["tile", "card"];
export const SINGLE_TYPES = ["hero", "alerts", "outlook", "wind", "sun", "week", "hourly"];
export const MODULE_TYPES = [...MULTI_TYPES, ...SINGLE_TYPES];
export const isConfigurable = (type) => MULTI_TYPES.includes(type);

// min  — smallest size the module stays usable at (resize / sanitize floor)
// size — size a newly added module starts with
export const MODULE_SPECS = {
    tile: { min: { w: 2, h: 1 }, size: { w: 2, h: 2 } },
    card: { min: { w: 3, h: 3 }, size: { w: 4, h: 5 } },
    hero: { min: { w: 4, h: 2 }, size: { w: 6, h: 3 } },
    alerts: { min: { w: 3, h: 1 }, size: { w: 6, h: 1 } },
    outlook: { min: { w: 3, h: 3 }, size: { w: 3, h: 6 } },
    wind: { min: { w: 3, h: 4 }, size: { w: 3, h: 6 } },
    sun: { min: { w: 4, h: 3 }, size: { w: 6, h: 4 } },
    week: { min: { w: 6, h: 3 }, size: { w: 10, h: 4 } },
    hourly: { min: { w: 6, h: 3 }, size: { w: 8, h: 4 } },
};

// ---------------------------------------------------
// default layout — the page as it was before it became editable
//   left  (cols 0-5)  : hero / alerts / next 24 h + wind / sun & moon
//   right (cols 6-17) : 12 instrument tiles, then 6 chart cards
//   bottom (rows 14-17): 7-day table + hourly table
// ---------------------------------------------------
const DEFAULT_TILES = [
    ["feelsLike", "graph"],
    ["dewPoint", "graph"],
    ["humidity", "graph"],
    ["wetBulb", "gauge"],
    ["pressure", "graph"],
    ["cloud", "graph"],
    ["visibility", "graph"],
    ["precip", "graph"],
    ["uv", "gauge"],
    ["wbgt", "gauge"],
    ["cape", "gauge"],
    ["freezing", "graph"],
];

const DEFAULT_CARDS = [
    [
        ["temperature", "area"],
        ["feelsLike", "line"],
        ["dewPoint", "line"],
    ],
    [
        ["humidity", "area"],
        ["cloud", "bar"],
    ],
    [["pressure", "area"]],
    [
        ["windSpeed", "area"],
        ["windGust", "line"],
    ],
    [
        ["precip", "bar"],
        ["precipProb", "line"],
    ],
    [
        ["uv", "area"],
        ["cape", "line"],
    ],
];

const fixed = (type, col, row, w, h) => ({ id: type, type, col, row, w, h, config: {} });

export function createDefaultLayout() {
    const items = [
        fixed("hero", 0, 0, 6, 3),
        fixed("alerts", 0, 3, 6, 1),
        fixed("outlook", 0, 4, 3, 6),
        fixed("wind", 3, 4, 3, 6),
        fixed("sun", 0, 10, 6, 4),
        ...DEFAULT_TILES.map(([metric, display], i) => ({
            id: `tile-${i + 1}`,
            type: "tile",
            col: 6 + (i % 6) * 2,
            row: Math.floor(i / 6) * 2,
            w: 2,
            h: 2,
            config: { metric, display },
        })),
        ...DEFAULT_CARDS.map((rows, i) => ({
            id: `card-${i + 1}`,
            type: "card",
            col: 6 + (i % 3) * 4,
            row: 4 + Math.floor(i / 3) * 5,
            w: 4,
            h: 5,
            config: { title: null, metrics: rows.map(([id, style]) => ({ id, style })) },
        })),
        fixed("week", 0, 14, 10, 4),
        fixed("hourly", 10, 14, 8, 4),
    ];
    return { version: LAYOUT_VERSION, columns: GRID.columns, rows: GRID.rows, items };
}

export const DEFAULT_LAYOUT = createDefaultLayout();

// ---------------------------------------------------
// config
// ---------------------------------------------------
export function defaultConfig(type, items = []) {
    if (type === "tile") {
        const used = new Set(items.filter((i) => i.type === "tile").map((i) => i.config.metric));
        const metric = METRIC_IDS.find((id) => !used.has(id)) ?? "temperature";
        return { metric, display: METRIC_DEFS[metric].display, sub: TILE_SUB_DEFAULT };
    }
    if (type === "card") {
        const used = new Set(
            items
                .filter((i) => i.type === "card")
                .flatMap((i) => i.config.metrics.map((m) => m.id)),
        );
        const id = METRIC_IDS.find((m) => !used.has(m)) ?? "temperature";
        return { title: null, metrics: [{ id, style: METRIC_DEFS[id].style }] };
    }
    return {};
}

function sanitizeConfig(type, raw) {
    const c = raw && typeof raw === "object" ? raw : {};
    if (type === "tile") {
        const metric = isMetricId(c.metric) ? c.metric : "temperature";
        const display = TILE_DISPLAYS.includes(c.display) ? c.display : METRIC_DEFS[metric].display;
        const sub = c.sub === TILE_SUB_NONE || isMetricId(c.sub) ? c.sub : TILE_SUB_DEFAULT;
        // Optional overrides are only kept when set: `color` replaces the graph's
        // default colour, `graph` holds the line-style keys this tile overrides.
        const graph = sanitizeGraphOverride(c.graph);
        return {
            metric,
            display,
            sub,
            ...(isHexColor(c.color) ? { color: c.color } : {}),
            ...(graph ? { graph } : {}),
        };
    }
    if (type === "card") {
        const rows = [];
        for (const r of Array.isArray(c.metrics) ? c.metrics : []) {
            if (!r || !isMetricId(r.id) || rows.some((x) => x.id === r.id)) continue;
            const row = {
                id: r.id,
                style: CARD_STYLES.includes(r.style) ? r.style : METRIC_DEFS[r.id].style,
            };
            if (rows.length >= MAX_CARD_METRICS || !cardAxesFit([...rows, row])) continue;
            rows.push(row);
        }
        if (rows.length === 0)
            rows.push({ id: "temperature", style: METRIC_DEFS.temperature.style });
        const title = typeof c.title === "string" ? c.title.trim().slice(0, 40) : "";
        const graph = sanitizeGraphOverride(c.graph);
        return { title: title || null, metrics: rows, ...(graph ? { graph } : {}) };
    }
    return {};
}

// ---------------------------------------------------
// placement
// ---------------------------------------------------
const { columns: COLS, rows: ROWS } = GRID;

const rectOf = (i) => ({ col: i.col, row: i.row, w: i.w, h: i.h });

export const overlaps = (a, b) =>
    a.col < b.col + b.w && b.col < a.col + a.w && a.row < b.row + b.h && b.row < a.row + a.h;

/**
 * Can `rect` be placed without leaving the grid or touching another module?
 * `ignoreIds` are the modules that are being moved / resized themselves.
 * Uses the dashboard's canPlaceAt, so both pages agree on what "occupied" means.
 * @returns {{ok:true}|{ok:false, reason:"out_of_bounds"|"occupied"}}
 */
export function checkPlacement(items, ignoreIds, rect) {
    const others = items
        .filter((i) => !ignoreIds.includes(i.id))
        .map((i) => ({ cellIndex: i.row * COLS + i.col, layout: { w: i.w, h: i.h } }));
    return canPlaceAt({ ...rect, columns: COLS, rows: ROWS, others });
}

/** First free spot (top-left first, row by row) for a w x h module, or null. */
export function findFreeSpot(items, w, h) {
    for (let row = 0; row + h <= ROWS; row += 1) {
        for (let col = 0; col + w <= COLS; col += 1) {
            if (checkPlacement(items, [], { col, row, w, h }).ok) return { col, row };
        }
    }
    return null;
}

/**
 * Where does a module end up if its top-left corner is dropped at (col, row)?
 * Free spot -> plain move. Dropped on exactly one other module that fits into
 * the vacated spot -> the two swap places (what makes rearranging a packed
 * grid possible). Anything else is refused.
 * @returns {{ok:boolean, reason?:string, rect:object, swap?:string, moves:Array<{id,col,row}>}}
 */
export function resolveMove(items, id, col, row) {
    const me = items.find((i) => i.id === id);
    const rect = { col, row, w: me.w, h: me.h };

    const direct = checkPlacement(items, [id], rect);
    if (direct.ok) return { ok: true, rect, moves: [{ id, col, row }] };
    if (direct.reason === "out_of_bounds")
        return { ok: false, reason: direct.reason, rect, moves: [] };

    const hits = items.filter((o) => o.id !== id && overlaps(rect, o));
    if (hits.length === 1) {
        const other = hits[0];
        const home = { col: me.col, row: me.row, w: other.w, h: other.h };
        if (
            checkPlacement(items, [id, other.id], rect).ok &&
            checkPlacement(items, [id, other.id], home).ok &&
            !overlaps(home, rect)
        ) {
            return {
                ok: true,
                swap: other.id,
                rect,
                moves: [
                    { id, col, row },
                    { id: other.id, col: me.col, row: me.row },
                ],
            };
        }
    }
    return { ok: false, reason: "occupied", rect, moves: [] };
}

/** Same module, new size (top-left stays). Respects the module's minimum size. */
export function resolveResize(items, id, w, h) {
    const me = items.find((i) => i.id === id);
    const min = MODULE_SPECS[me.type].min;
    const rect = { col: me.col, row: me.row, w: Math.max(min.w, w), h: Math.max(min.h, h) };
    return { ...checkPlacement(items, [id], rect), rect };
}

// ---------------------------------------------------
// editing
// ---------------------------------------------------
function nextId(items, type) {
    const n = items.reduce((max, i) => {
        const m = i.id.match(new RegExp(`^${type}-(\\d+)$`));
        return m ? Math.max(max, Number(m[1])) : max;
    }, 0);
    return `${type}-${n + 1}`;
}

/**
 * Builds a new module of `type` at the first free spot.
 * @returns {{item:object}|{error:"exists"|"no_space"}}
 */
export function createItem(items, type) {
    if (!MODULE_TYPES.includes(type)) return { error: "exists" };
    if (SINGLE_TYPES.includes(type) && items.some((i) => i.id === type)) return { error: "exists" };

    const { size, min } = MODULE_SPECS[type];
    // Prefer the normal size; fall back to the minimum when the grid is crowded.
    for (const s of [size, min]) {
        const spot = findFreeSpot(items, s.w, s.h);
        if (spot) {
            return {
                item: {
                    id: SINGLE_TYPES.includes(type) ? type : nextId(items, type),
                    type,
                    ...spot,
                    w: s.w,
                    h: s.h,
                    config: defaultConfig(type, items),
                },
            };
        }
    }
    return { error: "no_space" };
}

// ---------------------------------------------------
// load / repair
// ---------------------------------------------------
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const int = (v, fallback) => (Number.isFinite(Number(v)) ? Math.round(Number(v)) : fallback);

/**
 * Turns whatever is stored in settings into a layout that is safe to render:
 * unknown types / duplicate ids dropped, sizes and positions clamped to the
 * grid, a module that would overlap another one moved to a free spot (or
 * dropped when there is none). A missing / unreadable layout is the default.
 */
export function sanitizeLayout(raw) {
    if (!raw || typeof raw !== "object" || !Array.isArray(raw.items)) {
        return createDefaultLayout();
    }

    const items = [];
    const seen = new Set();

    for (const r of raw.items) {
        if (!r || !MODULE_TYPES.includes(r.type)) continue;

        const type = r.type;
        const id = SINGLE_TYPES.includes(type)
            ? type
            : typeof r.id === "string" && new RegExp(`^${type}-\\d+$`).test(r.id)
              ? r.id
              : nextId(items, type);
        if (seen.has(id)) continue;

        const { min } = MODULE_SPECS[type];
        const w = clamp(int(r.w, MODULE_SPECS[type].size.w), min.w, COLS);
        const h = clamp(int(r.h, MODULE_SPECS[type].size.h), min.h, ROWS);
        const item = {
            id,
            type,
            col: clamp(int(r.col, 0), 0, COLS - w),
            row: clamp(int(r.row, 0), 0, ROWS - h),
            w,
            h,
            config: sanitizeConfig(type, r.config),
        };

        if (!checkPlacement(items, [], rectOf(item)).ok) {
            const spot = findFreeSpot(items, w, h);
            if (!spot) continue;
            Object.assign(item, spot);
        }
        seen.add(id);
        items.push(item);
    }

    return { version: LAYOUT_VERSION, columns: COLS, rows: ROWS, items };
}
