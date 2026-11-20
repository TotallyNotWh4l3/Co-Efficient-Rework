// ===================================================
// ファイル名: SandboxErrorBoundary.jsx
// 作成日: 2026/11/20
// 概要: 試験中コンポーネントのエラーでページ全体が落ちないようにする境界
// ===================================================

import { Component } from "react";
import { TriangleAlert } from "lucide-react";

export default class SandboxErrorBoundary extends Component {
    state = { error: null };

    static getDerivedStateFromError(error) {
        return { error };
    }

    componentDidCatch(error, info) {
        console.error("[Sandbox] component crashed:", error, info.componentStack);
    }

    render() {
        const { error } = this.state;
        if (!error) return this.props.children;

        return (
            <div className="sandbox-error">
                <TriangleAlert size={20} />
                <strong>{this.props.title}</strong>
                <pre className="sandbox-error__message">{String(error?.message ?? error)}</pre>
            </div>
        );
    }
}
