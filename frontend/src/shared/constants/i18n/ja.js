// ===================================================
// ファイル名: ja.js
// 作成日: 2026/08/27
// 作成者: ゴンザガ　ウェイン
// 概要: 日本語言語リソース
// ===================================================

export default {
    dateNames: {
        dateFormat: "{year}年{month}{day}日 {weekday}",
        monthsLong: [
            "1月",
            "2月",
            "3月",
            "4月",
            "5月",
            "6月",
            "7月",
            "8月",
            "9月",
            "10月",
            "11月",
            "12月",
        ],
        weekdaysShort: ["日", "月", "火", "水", "木", "金", "土"],
        weekdaysLong: ["日曜日", "月曜日", "火曜日", "水曜日", "木曜日", "金曜日", "土曜日"],
    },

    dashboard: {
        header: {
            title: "Co:Efficient",
            subTitle: "更新情報",
        },
    },
    common: {
        loading: "読み込み中...",
        confirm: "確認",
        cancel: "キャンセル",
    },

    auth: {
        login: {
            username: "ユーザー名",
            password: "パスワード",
            submit: "ログイン",
        },
    },

    userMenu: {
        guest: "ゲスト",
        account: "アカウント",
    },

    errors: {
        loadUsers: "ユーザーを読み込めませんでした。",
        loadLocations: "場所を読み込めませんでした。",
        loadThemes: "テーマを読み込めませんでした。",
        loadSchedule: "スケジュールを読み込めませんでした。",
        loadTags: "タグを読み込めませんでした。",
        loadAnnouncements: "お知らせを読み込めませんでした。",
        geolocationUnsupported: "位置情報に対応していません。",
    },

    sidebar: {
        toggle: "ナビゲーションを切り替え",
        lock: "サイドバーを固定",
        unlock: "サイドバーの固定を解除",
        settings: "設定",
        login: "ログイン",
        logout: "サインアウト",
        soon: "近日公開",
        comingSoon: "このセクションはまだ準備中です。近日公開予定です。",
        sections: {
            dashboard: "ダッシュボード",
            attendance: "出席",
        },
    },

    settings: {
        title: "設定",
        autoSave: "自動保存済み",
        close: "設定を閉じる",
        status: {
            loading: "設定を読み込み中...",
            loadFailed: "設定を読み込めませんでした。",
            contentFailed: "設定内容を読み込めませんでした。",
        },

        sidebar: {
            interface: "インターフェース",
            dashboard: "ダッシュボード",
            modules: "モジュール",
            users: "ユーザー",
            about: "このアプリについて",
        },

        interface: {
            title: "インターフェース",
            description: "外観と言語の設定",

            language: {
                title: "言語",
                description: "表示言語を選択",
                add: "場所を追加",
            },

            appearance: {
                title: "外観",
                description: "外観とUI設定",
                current: "現在のテーマ",

                themes: {
                    title: "テーマ",
                    description: "テーマの管理",
                    builtIn: "プリセット",
                    custom: "カスタム",
                    apply: "適用",
                    create: "作成",
                    edit: "編集",
                    delete: "削除",
                },

                customization: {
                    title: "カスタマイズ",
                    description: "色・文字・枠線・効果",
                    colors: "カラー",
                    typography: "タイポグラフィ",
                    borders: "枠線",
                    effects: "エフェクト",
                },

                dialog: {
                    titleCreate: "テーマ作成",
                    titleEdit: "テーマ編集",
                    builtInNote: "プリセットは編集できません。コピーしてカスタマイズしてください。",
                    builtInAdminNote: "プリセットです。管理者は編集できますが削除できません。",
                    nameLabel: "名前",
                    cancel: "キャンセル",
                    save: "保存",
                    saving: "保存中...",
                    saveFailed: "テーマを保存できませんでした。",
                    defaultName: "{name}のコピー",
                    customName: "カスタム",
                    pickColor: "色を選択",
                    pickColorFor: "「{label}」の色を選択",
                    switchTo: "{format}に切り替え",
                    delete: "削除",
                    deleteFailed: "テーマを削除できませんでした。",

                    groups: {
                        accent: "アクセント",
                        surface: "背景＆サーフェス",
                        element: "エレメント",
                        border: "枠線",
                        text: "テキスト",
                        input: "入力フィールド",
                        status: "ステータス",
                        shadows: "シャドウ",
                    },

                    preview: {
                        title: "ライブプレビュー",
                        appName: "CoEfficient",
                        appSubtitle: "ダッシュボード",
                        weatherTitle: "天気",
                        weatherHint: "晴れときどき曇り",
                        scheduleTitle: "スケジュール",
                        eventOne: "朝会",
                        eventTwo: "デザインレビュー",
                        badgeSuccess: "完了",
                        badgeWarning: "まもなく",
                        badgeError: "期限超過",
                        textPrimary: "主要テキスト",
                        textSecondary: "副次テキスト",
                        textMuted: "補助テキスト",
                        inputPlaceholder: "入力フィールド",
                        secondaryButton: "キャンセル",
                        primaryButton: "保存",
                    },
                },
            },

            location: {
                title: "場所",
                description: "使用する場所を管理",

                current: {
                    title: "デフォルトの場所",
                    description: "デフォルトの場所を選択",
                },

                add: "場所を追加",
                empty: "保存された場所はありません。",
                deleteTitle: "場所を削除しますか？",
                deleteMessage:
                    "「{name}」をすべてのユーザーから削除します。この操作は取り消せません。",
                deleteConfirm: "削除",

                dialog: {
                    titleAdd: "場所を追加",
                    titleEdit: "場所を編集",

                    mode: {
                        search: "場所を検索",
                        coordinates: "座標",
                    },

                    search: {
                        label: "検索",
                        description: "都市・場所を検索して座標を取得（英語のみ）",
                        placeholder: "Tokyo",
                        button: "検索",
                        searching: "検索中...",
                        noResults: "場所が見つかりません。",
                        failed: "検索に失敗しました。",
                    },

                    name: {
                        label: "名前",
                        description: "任意。空欄時は座標から自動入力",
                        placeholder: "座標から自動入力",
                    },

                    latitude: {
                        label: "緯度",
                        required: "緯度は必須です。",
                        invalidNumber: "緯度は数値で入力してください。",
                        outOfRange: "緯度は -90 から 90 の間で入力してください。",
                    },

                    longitude: {
                        label: "経度",
                        required: "経度は必須です。",
                        invalidNumber: "経度は数値で入力してください。",
                        outOfRange: "経度は -180 から 180 の間で入力してください。",
                    },

                    gps: {
                        button: "現在地を使用",
                        locating: "取得中...",
                    },

                    footer: {
                        cancel: "キャンセル",
                        save: "保存",
                        saving: "保存中...",
                        saveFailed: "場所を保存できませんでした。",
                    },
                },
            },
        },

        dashboard: {
            title: "ダッシュボード",
            description: "新規ダッシュボードの初期レイアウト",

            layout: {
                title: "レイアウト",
                description: "列・間隔を設定",
                columns: "列数",
                rows: "行数",
                gap: "間隔",
                padding: "パディング",
            },

            moduleDefaults: {
                title: "モジュールのデフォルト",
                description: "追加時の初期設定",
            },
        },

        modules: {
            title: "モジュール",
            description: "モジュールの初期設定",
            available: "モジュールを追加",
            availableDescription: "追加するモジュールを選択",
            current: "現在のモジュール",
            currentDescription: "配置中のモジュール",
            empty: "モジュールがありません。上から追加してください。",
            remove: "削除",

            weather: {
                title: "天気",
            },

            schedule: {
                title: "スケジュール",
            },

            todaySchedule: {
                title: "今日・明日の予定",
            },

            clock: {
                title: "時計",
            },

            transit: {
                title: "電車・バス",
            },

            announcements: {
                title: "お知らせ",
            },

            size: {
                title: "サイズ",
                label: "セルサイズ",
                width: "幅",
                height: "高さ",
            },
            position: {
                title: "配置",
                description:
                    "ダッシュボードのグリッドを縮小表示します。各モジュールのセルとサイズを確認しながら、位置の移動とサイズ変更ができます。",
                gridLabel: "グリッド",
                cellApprox: "1セル ≈",
                hint: "モジュールをドラッグで移動、端や角をドラッグでサイズ変更",
                selectedHint: "配置したいセルをクリックしてください。",
                occupied: "その場所は他のモジュールが使用中です。",
                outOfBounds: "その位置にはモジュールが収まりません。",
                moveFailed: "モジュールを移動できませんでした。もう一度お試しください。",
                resizeHint: "モジュールの端や角をドラッグしてサイズを変更できます。",
                resizeBlocked: "その方向には広げる余裕がありません。",
                resizeFailed: "モジュールのサイズを変更できませんでした。もう一度お試しください。",
                resizeWidth: "幅を変更",
                resizeHeight: "高さを変更",
                resizeBoth: "サイズを変更",
                remove: "モジュールを削除",
                removeConfirm: "削除しますか？",
                removeYes: "削除",
                removeNo: "キャンセル",
                removeFailed: "モジュールを削除できませんでした。もう一度お試しください。",
            },
        },

        users: {
            title: "ユーザー管理",
            description: "ユーザーと権限を管理",

            addUser: {
                title: "ユーザーを追加",
                usernameLabel: "ユーザー名",
                usernamePlaceholder: "例: jsmith",
                passwordLabel: "パスワード",
                passwordPlaceholder: "仮パスワード",
                roleLabel: "権限（ロール）",
                submit: "ユーザーを作成",
                submitting: "作成中…",
                validationError: "ユーザー名とパスワードは必須です。",
                genericError: "ユーザーを作成できませんでした。",
            },

            allUsers: {
                title: "全ユーザー",
                loading: "読み込み中…",
                joined: "登録日: {date}",
            },

            roles: {
                user: "一般ユーザー",
                manager: "マネージャー",
                admin: "管理者",
            },

            delete: {
                title: "ユーザーを削除",
                confirm: '"{username}" を削除しますか？元に戻せません。',
                genericError: "ユーザーを削除できませんでした。",
            },

            setPassword: {
                title: "パスワードを設定",
                buttonTitle: "パスワードを設定",
                description: '"{username}" の新しいパスワードを設定します。',
                newPasswordLabel: "新しいパスワード",
                newPasswordPlaceholder: "8文字以上",
                confirmPasswordLabel: "パスワードの確認",
                confirmPasswordPlaceholder: "パスワードを再入力",
                submit: "パスワードを設定",
                submitting: "保存中…",
                cancel: "キャンセル",
                validationErrorLength: "8文字以上で入力してください。",
                validationErrorMismatch: "パスワードが一致しません。",
                genericError: "パスワードを更新できませんでした。",
                successToast: '"{username}" のパスワードを更新しました。',
            },
        },

        about: {
            title: "アプリについて",
            description: "アプリ情報とクレジット",
            versionTitle: "バージョン",
            stack: {
                title: "使用技術",
                description: "このアプリを支えるサービスと技術",
                roles: {
                    frontend: "フロントエンド",
                    backend: "バックエンド",
                    runtime: "ランタイム",
                    database: "データベース",
                    hosting: "ホスティング",
                    "database hosting": "DBホスティング",
                },
            },
            resetSectionTitle: "リセット",
            resetSectionDescription: "すべての設定を初期値に戻します。",
            resetButton: "初期値に戻す",
            resetTitle: "設定をリセットしますか？",
            resetMessage:
                "設定、テーマ、モジュールの初期値がリセットされます。この操作は取り消せません。",
            resetConfirm: "リセット",
        },
    },

    modules: {
        weather: {
            current: {
                wmoCode: "WMOコード",
                high: "最高",
                low: "最低",
                humidity: "湿度",
                wind: "風速",
                precipitation: "降水確率",
                loading: "読み込み中...",
                error: "天気を取得できませんでした",
                noData: "天気データがありません",
                retry: "再試行",
            },

            forecast: {
                title: "予報",
                updated: "更新:",
                hourly: "時間別",
                daily: "7日間",
                hourlyHint: "← カードを選択して時間変更",
                dailyHint: "7日間の推移",
                today: "今日",
                tomorrow: "明日",
                dayFallback: "{n}日目",
            },

            conditions: {
                clear: "快晴",
                mainlyClear: "晴れ",
                partlyCloudy: "晴れ時々曇り",
                overcast: "曇り",
                fog: "霧",
                drizzle: "霧雨",
                rain: "雨",
                snow: "降雪",
                showers: "にわか雨",
                thunderstorm: "雷雨",
                calm: "おだやか",
            },

            metrics: {
                temp: "気温",
                humidity: "湿度",
                precipChance: "降水確率",
                precipAmount: "降水量",
                windSpeed: "風速",
            },

            chart: {
                range: "範囲",
                max: "最高",
                min: "最低",
                school: "授業",
                now: "現在",
            },

            settings: {
                title: "天気設定",
                back: "戻る",
                schoolHours: {
                    title: "授業時間（時間別グラフに表示）",
                    start: "開始",
                    end: "終了",
                },

                layout: {
                    title: "表示レイアウト",

                    combined: {
                        title: "統合表示",
                        description: "現在の天気と7日間予報を表示",
                    },

                    current: {
                        title: "現在の天気",
                        description: "現在の天気のみ表示",
                    },

                    forecast: {
                        title: "予報のみ",
                        description: "7日間予報とグラフを表示",
                    },
                },

                active: "● 有効",
                tip: "列数はメイン設定から変更できます。",
            },

            header: {
                selectLocation: "場所を選択",
                moduleSettings: "モジュール設定",
                remove: "ボードから削除",
            },
        },

        clock: {
            am: "午前",
            pm: "午後",
            options: {
                title: "時計の設定",
                hour12: "12時間表示",
                showSeconds: "秒",
                showDate: "日付",
            },
        },
        transit: {
            header: {
                title: "電車・バス",
                changeStop: "駅・バス停を変更",
            },
            views: {
                toLine: "路線図で表示",
                toBoard: "発車一覧で表示",
            },
            options: {
                title: "路線図の設定",
                orientation: { label: "向き", horizontal: "横", vertical: "縦" },
                colorMode: { label: "色", mono: "白黒", theme: "テーマ" },
                timer: { label: "タイマー", seconds: "分と秒", minutes: "分のみ" },
            },
            line: {
                phase: {
                    waiting: "次の発車",
                    inbound: "接近中",
                    approaching: "まもなく到着",
                    atStation: "停車中",
                    atStop: "停車中",
                },
                departedAt: "{time} 発車",
                comingTrain: "電車が向かっています · あと{n}分",
                comingBus: "バスが向かっています · あと{n}分",
                following: "その次",
                arrivingSoon: "まもなく到着",
                minutes: "{n}分",
                hourMinutes: "{h}時間{m}分",
                tip: { departs: "発車", type: "種別", dest: "行き先", line: "路線" },
            },
            dayTypes: {
                weekday: "平日",
                saturday: "土曜",
                holiday: "日曜・祝日",
            },
            types: {
                local: "普通",
                express: "急行",
                limited_express: "特急",
                regular: "一般",
                night: "深夜",
            },
            toDest: "{dest}行き",
            now: "まもなく",
            inMin: "あと{n}分",
            inHourMin: "あと{h}時間{m}分",
            tomorrow: "明日",
            accessible: "車いす対応",
            noService: "この後の発車はありません。",
            selectStop: "駅・バス停を選択してください。",
            stopMissing: "選択した駅・バス停は利用できません。別のものを選んでください。",
            noStops: "駅・バス停が未登録です。管理者に時刻表ファイルの追加を依頼してください。",
            status: {
                loading: "時刻表を読み込み中...",
                errorTitle: "時刻表を読み込めませんでした",
                retry: "再試行",
            },
        },
        todaySchedule: {
            header: {
                title: "今日・明日の予定",
            },
            today: "今日",
            tomorrow: "明日",
            emptyToday: "今日の予定はありません。",
            emptyTomorrow: "明日の予定はありません。",
            status: {
                loading: "スケジュールを読み込み中...",
                errorTitle: "スケジュールを読み込めませんでした",
                retry: "再試行",
            },
        },
        schedule: {
            header: {
                title: "スケジュール",
                subtitle: "イベント・重要日程",
                addEvent: "イベントを追加",
                manageTags: "タグを管理",
                removeModule: "モジュールを削除",
                settings: "設定",
            },

            viewToggle: {
                absolute: "固定日付",
                relative: "相対表示",
            },

            layoutToggle: {
                month: "月",
                week: "週",
            },

            settings: {
                title: "スケジュール設定",
                back: "閉じる",
                active: "アクティブ",

                viewMode: {
                    title: "表示モード",

                    absolute: {
                        title: "固定日付（カレンダー）",
                        description: "月・週単位でカレンダーを表示",
                    },

                    relative: {
                        title: "相対表示",
                        description: "今日を基準に日数範囲を表示",
                    },
                },

                layout: {
                    title: "レイアウト",

                    month: {
                        title: "月表示",
                        description: "月全体を表示",
                    },

                    week: {
                        title: "週表示",
                        description: "1週間を表示",
                    },
                },

                orientation: {
                    title: "週表示の向き",
                    horizontal: {
                        title: "水平",
                        description:
                            "各日を横幅いっぱいの行にして、予定の詳細を表示しやすくします。",
                    },
                    vertical: {
                        title: "垂直",
                        description: "各日を縦の列にする、従来のカレンダー表示です。",
                    },
                },
            },

            calendar: {
                today: "今日",
                weekOf: "週開始日:",
                conflictTitle: "この時間は埋まっています",
            },

            relative: {
                configureTitle: "表示範囲",
                settingsTitle: "相対表示設定",
                daysBeforeLabel: "今日より前:",
                reset: "リセット",
            },

            dayList: {
                noEvents: "予定はありません。",
                addEvent: "イベントを追加",
            },

            detail: {
                title: "イベント詳細",
                editedBy: "作成者:",
                lockNote: "編集できるのは作成者または上位権限のユーザーです。",
                edit: "編集",
                delete: "削除",
                close: "閉じる",
                confirmDelete: "このイベントを削除しますか？",
            },

            form: {
                titleAdd: "イベント追加",
                titleEdit: "イベント編集",
                titleField: "タイトル *",
                titlePlaceholder: "例: チームスタンドアップ",
                subtitleField: "サブタイトル",
                subtitlePlaceholder: "任意",
                dateField: "日付 *",
                timeField: "時間 *",
                tagsField: "タグ",
                tagPriorityHint: "先頭タグがイベント色を決定",
                descriptionField: "詳細説明",
                descriptionPlaceholder: "補足情報など…",
                addedBy: "作成者",
                cancel: "キャンセル",
                saveChanges: "変更を保存",
                addEvent: "イベントを追加",
                delete: "削除",
                confirmDelete: "このイベントを削除しますか？",
            },

            tagManager: {
                title: "タグ管理",
                namePlaceholder: "タグ名（例: 会議）",
                add: "追加",
                noTags: "タグはありません。",
                deleteTitle: "タグを削除",
            },

            tagPicker: {
                noTagsHint: "タグはありません。管理者は「タグ管理」から追加できます。",
            },

            footer: {
                liveSync: "同期中",
            },

            status: {
                loading: "スケジュールを読み込み中…",
                errorTitle: "読み込みに失敗しました",
                retry: "再試行",
            },

            relative: {
                configureTitle: "表示範囲",
                settingsTitle: "相対表示設定",
                daysBeforeLabel: "今日より前:",
                windowHint: "前{before}日＋後{after}日（計{total}日）",
                reset: "リセット",
            },
        },

        announcement: {
            header: {
                title: "お知らせ",
                activeNotices: "有効:",
                unread: "未読",
                create: "作成",
                viewerOnly: "閲覧専用",
                viewArchive: "アーカイブ",
                compactView: "コンパクト",
                extendView: "拡張",
                removeModule: "モジュールを削除",
            },

            filters: {
                searchPlaceholder: "お知らせを検索...",
            },

            categories: {
                urgent: "緊急",
                maintenance: "メンテナンス",
                event: "イベント",
                announcement: "お知らせ",
                notice: "通知",
                general: "一般",
                all: "すべて",
            },

            list: {
                loading: "読み込み中...",
                emptyTitle: "お知らせがありません",
                emptyText: "条件に一致するお知らせがありません。",
            },

            item: {
                unread: "未読",
                edited: "編集済み",
                edit: "編集",
                delete: "削除",
            },

            detail: {
                pinned: "ピン留め",
                edited: "編集済み",
                closeReader: "閉じる",
            },

            form: {
                titleEdit: "お知らせを編集",
                titleCreate: "お知らせを作成",
                titleField: "お知らせのタイトル",
                titlePlaceholder: "例: 空調設備メンテナンスのお知らせ",
                categoriesField: "タグ・カテゴリ（複数可）",
                pinAutoHint: "※「緊急」は自動で上部に固定",
                pinManualHint: "フィード上部に固定",
                pinBulletin: "ピン留め",
                contentField: "本文",
                contentPlaceholder: "詳細・指示・対応手順など...",
                cancel: "キャンセル",
                update: "更新",
                publish: "公開",
            },

            archive: {
                title: "アーカイブ済みのお知らせ",
                empty: "アーカイブされたお知らせはありません。",
                archivedOn: "アーカイブ日",
                restore: "復元",
            },

            footer: {
                liveFeed: "同期中",
            },

            toast: {
                updated: "お知らせを更新しました。",
                published: "お知らせを公開しました！",
                deleted: "お知らせを削除しました。",
                restored: "お知らせを復元しました。",
                saveFailed: "保存に失敗しました",
                saveFailedGeneric: "保存に失敗しました。",
                deleteFailed: "削除に失敗しました。",
            },

            time: {
                justNow: "たった今",
                minutesAgo: "分前",
                hoursAgo: "時間前",
                daysAgo: "日前",
            },
        },

        modules: {
            title: "モジュール",
            description: "モジュールの初期設定",
            available: "モジュールを追加",
            availableDescription: "追加するモジュールを選択",
            current: "現在のモジュール",
            currentDescription: "配置中のモジュール",
            empty: "モジュールがありません。上から追加してください。",
            remove: "削除",

            weather: {
                title: "天気",
            },

            schedule: {
                title: "スケジュール",
            },

            announcements: {
                title: "お知らせ",
            },
        },
    },
};
