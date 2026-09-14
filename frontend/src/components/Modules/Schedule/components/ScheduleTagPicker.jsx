// ===================================================
// ファイル名: ScheduleTagPicker.jsx
// 作成日: 2026/08/27
// 作成者: ゴンザガ　ウェイン
// 概要: スケジュールタグピッカー コンポーネント
// ===================================================

import { Check } from "lucide-react";
import { useLanguage } from "../../../../hooks/useLanguage";

export default function ScheduleTagPicker({ tags, selectedTags, onToggle, disabled }) {
    const lang = useLanguage();
    const t = lang.modules.schedule.tagPicker;

    if (tags.length === 0) {
        return <p className="sch-empty-text">{t.noTagsHint}</p>;
    }

    return (
        <div className="sch-tag-picker">
            {tags.map((tag) => {
                const isSelected = selectedTags.includes(tag.id);
                return (
                    <button
                        type="button"
                        key={tag.id}
                        disabled={disabled}
                        onClick={() => onToggle(tag.id)}
                        className={`sch-tag-pick${isSelected ? " selected" : ""}`}
                        style={
                            isSelected
                                ? {
                                      background: `${tag.color}22`,
                                      borderColor: tag.color,
                                      color: tag.color,
                                  }
                                : undefined
                        }
                    >
                        <span className="sch-tag-dot" style={{ background: tag.color }} />
                        <span>{tag.id}</span>
                        {isSelected && <Check className="icon-xxs" />}
                    </button>
                );
            })}
        </div>
    );
}
