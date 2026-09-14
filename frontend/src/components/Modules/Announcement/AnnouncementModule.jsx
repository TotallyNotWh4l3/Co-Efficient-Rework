// ===================================================
// ファイル名: AnnouncementModule.jsx
// 作成日: 2026/08/27
// 作成者: ゴンザガ　ウェイン
// 概要: お知らせモジュールコンポーネント
// ===================================================

import { useState } from "react";
import useAnnouncements from "../../../hooks/useAnnouncements";
import { useDashboard } from "../../../hooks/useDashboard";
import { useSettings } from "../../../hooks/useSettings";
import { useAuth } from "../../../hooks/useAuth";
import { useLanguage } from "../../../hooks/useLanguage";
import AnnouncementHeader from "./components/AnnouncementHeader";
import AnnouncementFilters from "./components/AnnouncementFilters";
import AnnouncementList from "./components/AnnouncementList";
import AnnouncementFooter from "./components/AnnouncementFooter";
import AnnouncementToast from "./components/AnnouncementToast";
import AnnouncementDetailOverlay from "./components/AnnouncementDetailOverlay";
import AnnouncementFormModal from "./components/AnnouncementFormModal";
import AnnouncementArchiveModal from "./AnnouncementArchiveModal";
import "./announcement-module.css";

export default function AnnouncementModule({ module }) {
    const { removeModule, updateModuleSettings } = useDashboard();
    const { settings } = useSettings();
    const { user } = useAuth();
    const lang = useLanguage();
    const t = lang.modules.announcement;

    const isJapanese = settings?.preferences?.language === "ja";
    // users table only has id/username/role — there's no `name` column.
    const currentUser = user ? { id: user.id, name: user.username, role: user.role } : null;

    const isExtended = module.settings?.view === "extended";
    const setIsExtended = (next) =>
        updateModuleSettings(module.id, "view", next ? "extended" : "compact");
    const onRemove = () => removeModule(module.id);

    const {
        announcements,
        isLoading,
        error,
        createAnnouncement,
        updateAnnouncement,
        deleteAnnouncement,
        markAsRead,
        unreadCount,
    } = useAnnouncements({ recentOnly: !isExtended, live: true });

    const [searchQuery, setSearchQuery] = useState("");
    const [activeTab, setActiveTab] = useState("all");
    const [selectedItem, setSelectedItem] = useState(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showArchiveModal, setShowArchiveModal] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [successToast, setSuccessToast] = useState("");

    const [formTitle, setFormTitle] = useState("");
    const [formContent, setFormContent] = useState("");
    const [formCategories, setFormCategories] = useState(["general"]);
    const [formIsPinned, setFormIsPinned] = useState(false);

    const role = (currentUser?.role || "").toLowerCase();
    const isAdmin = role === "admin";
    const isManagerOrAbove = role === "manager" || isAdmin;
    const canModify = (item) => isAdmin || item.authorId === currentUser?.id;

    const showToast = (msg) => {
        setSuccessToast(msg);
        setTimeout(() => setSuccessToast(""), 3000);
    };

    const resetForm = () => {
        setFormTitle("");
        setFormContent("");
        setFormCategories(["general"]);
        setFormIsPinned(false);
        setEditingId(null);
    };

    const openCreate = () => {
        resetForm();
        setShowCreateModal(true);
    };

    const openEdit = (item, e) => {
        e.stopPropagation();
        setEditingId(item.id);
        setFormTitle(item.title);
        setFormContent(item.content);
        setFormCategories(item.categories);
        setFormIsPinned(item.isPinned);
        setShowCreateModal(true);
    };

    const closeForm = () => {
        setShowCreateModal(false);
        resetForm();
    };

    const toggleFormCategory = (id) => {
        let updated;
        if (formCategories.includes(id)) {
            if (formCategories.length === 1) return;
            updated = formCategories.filter((c) => c !== id);
        } else {
            updated = [...formCategories, id];
        }
        if (updated.includes("urgent")) setFormIsPinned(true);
        setFormCategories(updated);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formTitle.trim() || !formContent.trim()) return;

        const payload = {
            title: formTitle,
            titleJa: formTitle,
            content: formContent,
            contentJa: formContent,
            categories: formCategories,
            isPinned: formCategories.includes("urgent") ? true : formIsPinned,
        };

        try {
            if (editingId) {
                await updateAnnouncement(editingId, payload);
                showToast(t.toast.updated);
            } else {
                await createAnnouncement(payload);
                showToast(t.toast.published);
            }
            resetForm();
            setShowCreateModal(false);
        } catch (err) {
            const serverMessage = err?.response?.data?.message;
            console.error(
                "[AnnouncementModule] Save failed:",
                err?.response?.status,
                err?.response?.data || err,
            );
            showToast(
                serverMessage
                    ? `${t.toast.saveFailed}: ${serverMessage}`
                    : t.toast.saveFailedGeneric,
            );
        }
    };

    const handleDelete = async (id, e) => {
        if (e) e.stopPropagation();
        try {
            await deleteAnnouncement(id);
            showToast(t.toast.deleted);
        } catch {
            showToast(t.toast.deleteFailed);
        }
    };

    const handleSelectItem = (item) => {
        setSelectedItem(item);
        if (!item.isRead) markAsRead(item.id);
    };

    const filtered = (announcements || []).filter((item) => {
        const itemCats = item.categories || ["general"];
        const matchesTab = activeTab === "all" || itemCats.includes(activeTab);
        const q = searchQuery.toLowerCase();
        const title = (isJapanese ? item.titleJa || item.title : item.title).toLowerCase();
        const content = (isJapanese ? item.contentJa || item.content : item.content).toLowerCase();
        return matchesTab && (title.includes(q) || content.includes(q));
    });

    return (
        <div className="ann-card" style={{ minHeight: isExtended ? "650px" : "320px" }}>
            <div className="ann-glow ann-glow-top" />
            <div className="ann-glow ann-glow-bottom" />

            <AnnouncementHeader
                filteredCount={filtered.length}
                unreadCount={unreadCount}
                currentUser={currentUser}
                onCreate={openCreate}
                onOpenArchive={() => setShowArchiveModal(true)}
                isExtended={isExtended}
                onToggleExtended={() => setIsExtended(!isExtended)}
                onRemove={onRemove}
            />

            <div className="ann-body">
                <AnnouncementFilters
                    searchQuery={searchQuery}
                    onSearchChange={setSearchQuery}
                    activeTab={activeTab}
                    onTabChange={setActiveTab}
                />

                <AnnouncementList
                    isJapanese={isJapanese}
                    isExtended={isExtended}
                    isLoading={isLoading}
                    error={error}
                    filtered={filtered}
                    canModify={canModify}
                    onSelectItem={handleSelectItem}
                    onEditItem={openEdit}
                    onDeleteItem={handleDelete}
                />
            </div>

            <AnnouncementFooter />

            <AnnouncementToast message={successToast} />

            <AnnouncementDetailOverlay
                item={selectedItem}
                isJapanese={isJapanese}
                onClose={() => setSelectedItem(null)}
            />

            {showCreateModal && (
                <AnnouncementFormModal
                    editingId={editingId}
                    formTitle={formTitle}
                    formContent={formContent}
                    formCategories={formCategories}
                    formIsPinned={formIsPinned}
                    onTitleChange={setFormTitle}
                    onContentChange={setFormContent}
                    onToggleCategory={toggleFormCategory}
                    onPinnedChange={setFormIsPinned}
                    onSubmit={handleSubmit}
                    onClose={closeForm}
                />
            )}

            {showArchiveModal && (
                <AnnouncementArchiveModal
                    isManagerOrAbove={isManagerOrAbove}
                    onClose={() => setShowArchiveModal(false)}
                    onRestored={() => showToast(t.toast.restored)}
                />
            )}
        </div>
    );
}
