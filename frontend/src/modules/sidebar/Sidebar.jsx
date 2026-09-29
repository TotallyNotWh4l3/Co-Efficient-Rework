// ===================================================
// ファイル名: Sidebar.jsx
// 作成日: 2026/09/29
// 概要: サイドバー（ナビゲーション）コンポーネント
// ===================================================

import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { GripVertical, User, Settings, Lock, LockOpen, LogIn, LogOut } from "lucide-react";
import { useAuth } from "../auth/useAuth";
import { useLanguage } from "../settings/useLanguage";
import { getVisibleSections } from "./sections";
import "./sidebar.css";

export default function Sidebar({ sidebar, activeSection, onSelectSection, onOpenSettings }) {
    const { user, logout } = useAuth();
    const T = useLanguage().sidebar;
    const { isOpen, toggleOpen, closeSidebar, isLocked, toggleLocked } = sidebar;

    const isLoggedIn = user !== null;
    const visibleSections = getVisibleSections(user);
    const displayName = isLoggedIn ? user.username : "Guest";

    return (
        <>
            {/* A slim grip peeking out from the very left edge of the
                screen — mostly off-screen at rest, slides fully into
                view on hover. Tracks the panel: sits at the viewport
                edge while closed, and slides out to the panel's own
                right edge once it's open (unlocked or locked), so it
                always reads as "the handle for this panel" rather than
                a fixed button that happens to sit near it. */}
            <button
                className={`sidebar-handle${isOpen ? " sidebar-handle--open" : ""}`}
                onClick={toggleOpen}
                aria-label={T.toggle}
                aria-expanded={isOpen}
            >
                <GripVertical size={14} />
            </button>

            {/* Unlocked + open = a floating overlay above the content, so
                clicking outside it should close it. Locked mode reserves
                its own space in the layout (see sidebar.css /
                --sidebar-locked), so there's no "outside" to click and no
                overlay/backdrop is rendered. */}
            {isOpen && !isLocked && <div className="sidebar-backdrop" onClick={closeSidebar} />}

            <aside
                className={`sidebar${isOpen ? " sidebar--open" : ""}${
                    isLocked ? " sidebar--locked" : ""
                }`}
            >
                <div className="sidebar__top">
                    <DropdownMenu.Root>
                        <DropdownMenu.Trigger asChild>
                            <button className="sidebar__identity">
                                <span className="sidebar__avatar">
                                    <User size={16} />
                                </span>
                                <span className="sidebar__username">{displayName}</span>
                            </button>
                        </DropdownMenu.Trigger>

                        <DropdownMenu.Portal>
                            <DropdownMenu.Content
                                className="sidebar__identity-menu"
                                sideOffset={8}
                                align="start"
                            >
                                {!isLoggedIn && (
                                    <DropdownMenu.Item className="sidebar__identity-menu-item">
                                        <LogIn size={16} />
                                        {T.login}
                                    </DropdownMenu.Item>
                                )}

                                {isLoggedIn && (
                                    <DropdownMenu.Item
                                        className="sidebar__identity-menu-item"
                                        onSelect={logout}
                                    >
                                        <LogOut size={16} />
                                        {T.logout}
                                    </DropdownMenu.Item>
                                )}
                            </DropdownMenu.Content>
                        </DropdownMenu.Portal>
                    </DropdownMenu.Root>

                    <div className="sidebar__top-actions">
                        <button
                            className={`sidebar__icon-btn${isLocked ? " sidebar__icon-btn--active" : ""}`}
                            onClick={toggleLocked}
                            aria-label={isLocked ? T.unlock : T.lock}
                            title={isLocked ? T.unlock : T.lock}
                        >
                            {isLocked ? <Lock size={15} /> : <LockOpen size={15} />}
                        </button>
                        <button
                            className="sidebar__icon-btn"
                            onClick={onOpenSettings}
                            aria-label={T.settings}
                            title={T.settings}
                        >
                            <Settings size={15} />
                        </button>
                    </div>
                </div>

                <div className="sidebar__separator" />

                <nav className="sidebar__sections">
                    {visibleSections.map((section) => {
                        const Icon = section.icon;
                        const isActive = activeSection === section.id;
                        return (
                            <button
                                key={section.id}
                                className={`sidebar__section-btn${isActive ? " sidebar__section-btn--active" : ""}`}
                                onClick={() => onSelectSection(section.id)}
                            >
                                <Icon size={16} />
                                <span>{T.sections[section.id] ?? section.id}</span>
                                {section.comingSoon && (
                                    <span className="sidebar__soon-badge">{T.soon}</span>
                                )}
                            </button>
                        );
                    })}
                </nav>
            </aside>
        </>
    );
}
