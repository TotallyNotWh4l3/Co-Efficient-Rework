

// Designs
import { Settings } from "lucide-react";

// CSS
import "./settings-button.css";

import { useLanguage } from "../../settings/useLanguage";

export default function SettingsButton({ setIsOpen }) {
    const T = useLanguage();
    return (
        <button className="settings-button" onClick={() => setIsOpen(true)}>
            <Settings size={16} />
            {T.settings.title}
        </button>
    );
}
