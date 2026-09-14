// ===================================================
// ファイル名: LocationList.jsx
// 作成日: 2026/08/27
// 作成者: ゴンザガ　ウェイン
// 概要: ロケーションリスト コンポーネント
// ===================================================


import { Pencil, Trash2, MapPin, Lock } from "lucide-react";

import Settings from "./SettingsComponents";
import "./location-list.css"

export default function LocationList({
    locations,
    defaultLocationId,
    canManage = false,

    onEdit,
    onDelete,
}) {
    return (
        <div className="location-list">
            {locations.map((location) => (
                <Settings.Row key={location.id}>
                    <Settings.RowContent>
                        <Settings.RowLabel>
                            <MapPin size={16} />

                            {location.name}
                        </Settings.RowLabel>

                        <Settings.RowDescription>
                            {location.latitude.toFixed(2)}, {location.longitude.toFixed(2)}
                        </Settings.RowDescription>
                    </Settings.RowContent>

                    {location.builtIn ? (
                        <Lock size={18} />
                    ) : canManage ? (
                        <div className="location-list__actions">
                            <button onClick={() => onEdit(location)}>
                                <Pencil size={16} />
                            </button>

                            <button
                                onClick={() => onDelete(location)}
                                disabled={location.id === defaultLocationId}
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    ) : null}
                </Settings.Row>
            ))}
        </div>
    );
}
