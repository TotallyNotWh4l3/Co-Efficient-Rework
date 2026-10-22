// ===================================================
// ファイル名: transit.schema.js
// 作成日: 2026/09/30
// 作成者: ゴンザガ　ウェイン
// 概要: 交通(駅・バス停)時刻表JSONファイルの検証スキーマ (Zod)。
//       ユーザーが手書きするJSONの形式チェックに使用します。
// ===================================================

import { z } from "zod";

export const TRANSIT_FORMAT_VERSION = 2;

export const DAY_TYPES = ["weekday", "saturday", "holiday"];

// 英数字とハイフンのみ (小文字)。例: "hisai", "kintetsu-nagoya"
const idSchema = z
    .string()
    .regex(
        /^[a-z0-9][a-z0-9-]*$/,
        "id は英小文字・数字・ハイフンのみ使用できます (例: my-station)",
    );

// "HH:mm" (24時間表記)。深夜は 24:10 や 25:03 のように 24 以上で表す (00〜29時まで)。
const timeSchema = z
    .string()
    .regex(
        /^(?:[01]\d|2\d):[0-5]\d$/,
        "時刻は HH:mm 形式で入力してください (例: 07:05 / 深夜は 24:10)",
    );

// 種別キー (例: local, express, limited_express, rapid, night)。
// 表示名は言語ファイル側で対応付けるため、ここでは形式のみ確認する。
const typeKeySchema = z
    .string()
    .regex(
        /^[a-z][a-z0-9_]*$/,
        "type は英小文字と _ のみ使用できます (例: local, limited_express)",
    );

const nonEmpty = z.string().trim().min(1, "空にはできません");

const departureSchema = z
    .object({
        time: timeSchema,
        type: typeKeySchema,
        dest: nonEmpty.optional(),
        series: nonEmpty.optional(), // 愛称など (例: UL, ISL, V)
        accessible: z.boolean().optional(), // 車いす対応車両
    })
    .strict();

const timetableSchema = z
    .object({
        days: z
            .array(z.enum(DAY_TYPES, { error: `days は ${DAY_TYPES.join(" / ")} のいずれかです` }))
            .min(1, "days に1つ以上指定してください")
            .refine((days) => new Set(days).size === days.length, "days に重複があります"),
        departures: z.array(departureSchema),
    })
    .strict();

const serviceSchema = z
    .object({
        id: idSchema,
        operator: nonEmpty.optional(),
        line: nonEmpty, // 路線名 (バスなら系統番号)
        timetables: z.array(timetableSchema).min(1, "timetables に1つ以上必要です"),
    })
    .strict()
    .superRefine((service, ctx) => {
        // 同じ曜日区分が複数の timetable に含まれてはいけない
        const seen = new Map();
        service.timetables.forEach((tt, i) => {
            tt.days.forEach((day) => {
                if (seen.has(day)) {
                    ctx.addIssue({
                        code: "custom",
                        path: ["timetables", i, "days"],
                        message: `"${day}" は timetables[${seen.get(day)}] にも含まれています (重複)`,
                    });
                } else {
                    seen.set(day, i);
                }
            });
        });
    });

const directionSchema = z
    .object({
        id: idSchema,
        label: nonEmpty,
        // 縦表示での電車の進行方向 (実際の路線図の向き)。up = 下から上へ、down = 上から下へ。
        // 省略時は 1番目の方面が up、2番目以降が down。
        heading: z.enum(["up", "down"], { error: 'heading は "up" か "down" です' }).optional(),
        services: z.array(serviceSchema).min(1, "services に1つ以上必要です"),
    })
    .strict();

const stopSchema = z
    .object({
        id: idSchema,
        type: z.enum(["station", "busStop"], { error: 'type は "station" か "busStop" です' }),
        name: nonEmpty,
        directions: z.array(directionSchema).min(1, "directions に1つ以上必要です"),
    })
    .strict()
    .superRefine((stop, ctx) => {
        const dirIds = new Set();
        const serviceIds = new Set();
        stop.directions.forEach((dir, di) => {
            if (dirIds.has(dir.id)) {
                ctx.addIssue({
                    code: "custom",
                    path: ["directions", di, "id"],
                    message: `direction の id "${dir.id}" が重複しています`,
                });
            }
            dirIds.add(dir.id);

            dir.services.forEach((svc, si) => {
                if (serviceIds.has(svc.id)) {
                    ctx.addIssue({
                        code: "custom",
                        path: ["directions", di, "services", si, "id"],
                        message: `service の id "${svc.id}" がこの駅/バス停内で重複しています`,
                    });
                }
                serviceIds.add(svc.id);
            });
        });
    });

export const transitFileSchema = z
    .object({
        version: z.literal(TRANSIT_FORMAT_VERSION, {
            error: `version は ${TRANSIT_FORMAT_VERSION} にしてください`,
        }),
        stops: z.array(stopSchema).min(1, "stops に1つ以上必要です"),
    })
    .strict();
