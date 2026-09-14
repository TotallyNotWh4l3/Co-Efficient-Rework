
// ===================================================
// ファイル名: ModuleRenderer.jsx
// 作成日: 2026/08/27
// 作成者: ゴンザガ　ウェイン
// 概要: モジュールレンダラーコンポーネント
// ===================================================

import WeatherModuleContainer from "../Weather/WeatherModuleContainer";
import AnnouncementCard from "../Announcement/AnnouncementModule";
import ScheduleModule from "../Schedule/ScheduleModule";
const MODULE_COMPONENTS = {
    weather: WeatherModuleContainer,
    announcement: AnnouncementCard,
    schedule: ScheduleModule,
};

export default function ModuleRenderer({ module, onSelect }) {
    const Component = MODULE_COMPONENTS[module.type];

    if (!Component) {
        return null;
    }

    return (
        <div onClick={() => onSelect(module.id)}>
            <Component module={module} />
        </div>
    );
}
