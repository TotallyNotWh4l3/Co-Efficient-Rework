// ===================================================
// ファイル名: ModuleRenderer.jsx
// 作成日: 2026/08/27
// 作成者: ゴンザガ　ウェイン
// 概要: モジュールレンダラーコンポーネント
// ===================================================

import WeatherModuleContainer from "../../modules/weather/WeatherModuleContainer";
import AnnouncementCard from "../../modules/announcements/AnnouncementModule";
import ScheduleModule from "../../modules/schedule/ScheduleModule";
import TodayScheduleModule from "../../modules/schedule/TodayScheduleModule";
import ClockModule from "../../modules/clock/ClockModule";
import TransitModule from "../../modules/transit/TransitModule";
import "./module-renderer.css";
const MODULE_COMPONENTS = {
    weather: WeatherModuleContainer,
    announcement: AnnouncementCard,
    schedule: ScheduleModule,
    todaySchedule: TodayScheduleModule,
    clock: ClockModule,
    transit: TransitModule,
};

export default function ModuleRenderer({ module, onSelect }) {
    const Component = MODULE_COMPONENTS[module.type];

    if (!Component) {
        return null;
    }

    return (
        <div className="module-renderer" onClick={() => onSelect(module.id)}>
            <Component module={module} />
        </div>
    );
}
