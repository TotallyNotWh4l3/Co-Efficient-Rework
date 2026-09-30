# 交通モジュール — 時刻表JSONの書き方

駅・バス停の時刻表は `backend/data/transit/` に置いた JSON ファイルから読み込まれます。
新しい駅を追加するときは、`_template.json` をコピーして書き換えてください。

- ファイル名は自由です (例: `tsu.json`)。`_` で始まるファイルは読み込まれません。
- 1ファイルに複数の駅/バス停を入れても、1駅1ファイルでも構いません。
- ファイルを保存すると、次のアクセス時に自動で再読み込みされます (サーバー再起動は不要)。
- 書式に誤りがあるファイルは**丸ごとスキップ**されます。原因は `GET /api/transit/errors` (manager 以上)
  とサーバーのログに、場所つきで表示されます。

## 構造

```
ファイル
└ stops[]                駅 / バス停
  └ directions[]         方面
    └ services[]         路線 (バスなら系統)
      └ timetables[]     曜日区分ごとの時刻表
        └ departures[]   1本ごとの発車時刻
```

## 項目

| 場所 | 項目 | 必須 | 説明 |
| --- | --- | --- | --- |
| ファイル | `version` | ○ | `2` 固定 |
| stop | `id` | ○ | 英小文字・数字・ハイフン。全ファイルで重複不可 (例: `hisai`) |
| stop | `type` | ○ | `"station"` または `"busStop"` |
| stop | `name` | ○ | 表示名 |
| direction | `id` / `label` | ○ | `id` は駅内で重複不可。`label` は表示名 (例: `名古屋方面`) |
| service | `id` | ○ | 駅/バス停内で重複不可 |
| service | `line` | ○ | 路線名 (バスは系統番号) |
| service | `operator` | | 事業者名 |
| timetable | `days` | ○ | `weekday` / `saturday` / `holiday` の組み合わせ |
| timetable | `departures` | ○ | 発車のリスト |
| departure | `time` | ○ | `"HH:mm"` |
| departure | `type` | ○ | 種別キー (下記) |
| departure | `dest` | | 行き先 |
| departure | `series` | | 愛称 (例: `UL`, `ISL`, `V`) |
| departure | `accessible` | | 車いす対応なら `true` |

## ルール

- **曜日区分**: `holiday` は日曜と祝日、`saturday` は土曜です。同じ内容の区分は
  `"days": ["saturday", "holiday"]` のようにまとめられます。1つの service 内で、同じ曜日区分を複数の
  timetable に入れることはできません。時刻表がない曜日区分は「運行なし」として扱われます。
- **時刻**: 24時間表記で `"07:05"` のようにゼロ埋めします。**深夜0時を過ぎた便は `"24:10"`、
  `"25:03"` のように 24 以上**で書きます (最大 `29:59`)。
- **並び順**: `departures` は順不同でも、読み込み時に時刻順に並べ替えられます。
- **種別キー**: 英小文字と `_` のみ。既知のキー: `local` (普通), `express` (急行),
  `limited_express` (特急)。バスなどは `regular`, `night` など自由に追加できます。

## 確認のしかた

1. ファイルを保存する
2. `GET /api/transit/stops` に駅が表示されるか確認する
3. 表示されなければ `GET /api/transit/errors` (またはサーバーのログ) を見る
