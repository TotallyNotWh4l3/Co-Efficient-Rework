// ===================================================
// ファイル名: 004_create_weather_data.js
// 作成日: 2026/08/27
// 作成者: ゴンザガ　ウェイン
// 概要: 天気データテーブルを作成するマイグレーション
// ===================================================

import weatherDataSchema from "../../../modules/weather/weatherData.schema.js";

export default function createWeatherDataTable(db) {
    return new Promise((resolve, reject) => {
        db.exec(weatherDataSchema, (error) => {
            if (error) {
                reject(error);
                return;
            }

            resolve();
        });
    });
}
