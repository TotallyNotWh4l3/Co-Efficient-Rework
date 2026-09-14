
// ===================================================
// ファイル名: UserButton.jsx
// 作成日: 2026/08/27
// 作成者: ゴンザガ　ウェイン
// 概要: ユーザーボタンコンポーネント
// ===================================================

import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { User, LogIn, LogOut, ChevronDown } from "lucide-react";
import { useAuth } from "../../../hooks/useAuth";
import "./user-button.css";

export default function UserButton() {
    const { user, logout } = useAuth();

    const isLoggedIn = user !== null;

    return (
        <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
                <button className="user-button">
                    <User size={18} />

                    <span className="user-button__username">
                        {isLoggedIn ? user.username : "Guest"}
                    </span>

                    <ChevronDown size={16} />
                </button>
            </DropdownMenu.Trigger>

            <DropdownMenu.Portal>
                <DropdownMenu.Content className="user-button__content" sideOffset={8} align="end">
                    <DropdownMenu.Label className="user-button__label">Account</DropdownMenu.Label>

                    {!isLoggedIn && (
                        <DropdownMenu.Item className="user-button__item">
                            <LogIn size={16} />
                            Login
                        </DropdownMenu.Item>
                    )}

                    {isLoggedIn && (
                        <>
                            <DropdownMenu.Separator className="user-button__separator" />

                            <DropdownMenu.Item className="user-button__item" onSelect={logout}>
                                <LogOut size={16} />
                                Sign Out
                            </DropdownMenu.Item>
                        </>
                    )}
                </DropdownMenu.Content>
            </DropdownMenu.Portal>
        </DropdownMenu.Root>
    );
}
