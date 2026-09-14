// ===================================================
// ファイル名: announcementArchiveJob.js
// 作成日: 2026/08/27
// 作成者: ゴンザガ　ウェイン
// 概要: お知らせアーカイブジョブ
// ===================================================

import Announcement from "./Announcement.js";
import { broadcast } from "../../sse/SSEController.js";

const CHECK_INTERVAL_MS = 60 * 60 * 1000; // hourly

export async function runOnce() {
    const archived = await Announcement.autoArchiveStale();
    archived.forEach((item) => broadcast("announcements:archived", item));
    if (archived.length) {
        console.log(`[announcement-archive-job] Auto-archived ${archived.length} announcement(s).`);
    }
}

export function startAnnouncementArchiveJob() {
    runOnce(); // run once on boot
    setInterval(runOnce, CHECK_INTERVAL_MS);
}
