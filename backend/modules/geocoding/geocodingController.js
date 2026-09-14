// ===================================================
// ファイル名: geocodingCotroller.js
// 作成日: 2026/08/27
// 作成者: ゴンザガ　ウェイン
// 概要: ジオコーディング関連のAPIコントローラー。住所検索（フォワードジオコーディング）および座標から住所を取得する（リバースジオコーディング）機能を提供します。
// ===================================================


// backend/controllers/geocodingController.js
import { forwardGeocode, reverseGeocode } from "./geocodingService.js";

const geocodingController = {
    // GET /api/geocoding/search?q=Tokyo
    async search(req, res) {
        const query = req.query.q?.trim();
        if (!query) {
            return res.status(400).json({ message: "Query parameter 'q' is required." });
        }

        try {
            const results = await forwardGeocode(query);
            res.json(results);
        } catch (error) {
            console.error(error);
            res.status(502).json({ message: "Geocoding search failed." });
        }
    },

    // GET /api/geocoding/reverse?lat=35.68&lon=139.69
    async reverse(req, res) {
        const lat = Number(req.query.lat);
        const lon = Number(req.query.lon);

        if (Number.isNaN(lat) || Number.isNaN(lon)) {
            return res
                .status(400)
                .json({ message: "Valid 'lat' and 'lon' query params are required." });
        }

        try {
            const name = await reverseGeocode(lat, lon);
            res.json({ name });
        } catch (error) {
            console.error(error);
            res.status(502).json({ message: "Reverse geocoding failed." });
        }
    },
};

export default geocodingController;
