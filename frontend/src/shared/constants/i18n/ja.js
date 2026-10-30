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
        collapseHeader: "ヘッダーを隠す",
        expandHeader: "ヘッダーを表示",
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
        geolocationUnsupported: "このブラウザでは位置情報を利用できません。",
    },

    sidebar: {
        toggle: "ナビゲーションを切り替え",
        lock: "サイドバーを固定",
        unlock: "サイドバーの固定を解除",
        settings: "設定",
        login: "ログイン",
        logout: "ログアウト",
        soon: "近日公開",
        comingSoon: "この機能は現在準備中です。公開までお待ちください。",
        sections: {
            dashboard: "ダッシュボード",
            attendance: "出席",
            weather: "天気",
        },
    },

    weatherPage: {
        title: "ウェザーラボ",
        source: "天気データ：Open-Meteo",
        location: "場所",
        refresh: "更新",
        loading: "天気を読み込み中...",
        error: "天気を取得できませんでした。",
        noData: "天気データを受信できませんでした。",
        retry: "再試行",
        now: "現在",
        ranges: {
            h24: "24時間",
            h48: "48時間",
            h72: "72時間",
            d7: "7日間",
        },

        hero: {
            dataTime: "データの時刻（現地時間）",
            minAgo: "分前",
            position: "座標",
            timezone: "タイムゾーン",
            today: "今日の最高気温 / 最低気温",
        },

        sections: {
            instruments: "天気の詳しい情報",
            windSun: "風と太陽",
            trends: "変化の傾向",
            week: "7日間の一覧",
            raw: "時間ごとのデータ（今後48時間）",
        },

        tiles: {
            feelsLike: "体感温度",
            dewPoint: "露点",
            spread: "温度差",
            humidity: "湿度",
            wetBulb: "湿球温度",
            pressure: "気圧",
            cloud: "雲の量",
            base: "雲底の高さ",
            visibility: "見通し",
            hourlyModel: "時間ごとの予報",
            precip: "雨の量",
            prob: "雨の確率",
            uv: "紫外線",
            wbgt: "暑さ指数（推定）",
            cape: "雷雨の発生しやすさ",
            freezing: "0℃になる高さ",
        },

        // モジュール選択・タイルのラベル・チャートカードのタイトルに使う指標名
        metrics: {
            temperature: "気温",
            feelsLike: "体感温度",
            dewPoint: "露点",
            wetBulb: "湿球温度",
            wbgt: "暑さ指数（推定）",
            humidity: "湿度",
            cloud: "雲の量",
            precip: "雨の量",
            precipProb: "雨の確率",
            pressure: "気圧",
            windSpeed: "風速",
            windGust: "最大瞬間風速",
            uv: "紫外線",
            cape: "雷雨の発生しやすさ",
            visibility: "見通し",
            freezing: "0℃になる高さ",
        },

        hints: {
            feelsLike: "気温・湿度・風をもとに計算した、体で感じる暑さや寒さです。",
            dewPoint:
                "気温と湿度から計算した露点です。気温との差が小さいほど、空気中の水分が飽和状態に近づいています。",
            humidity: "空気中の水分の割合です。VPD（飽差）は、空気の乾燥具合を表す目安です。",
            wetBulb: "気温と湿度から、Stull（2011）の近似式を使って計算しています。",
            pressure:
                "海面の高さに換算した気圧です。現在と3時間後の予報を比べて、変化の傾向を表示します。",
            cloud: "空全体に占める雲の割合です。雲の高さは気温と露点の差から推定し、雲の量が25%以上のときに表示します。",
            visibility: "現在の時間帯における、モデルで予測された見通しです。",
            precip: "現在の時間帯の雨の量（mm）と、雨が降る確率です。",
            uv: "現在の紫外線の強さです。「最大」は今日の予報で最も強くなる値を表します。",
            wbgt: "気温・湿度・日差し・風から推定した屋外の暑さ指数です。区分は環境省の基準に準拠しています。",
            cape: "雷雨が発生するためのエネルギーの目安です。値が大きいほど、大気の状態が不安定な可能性があります。",
            freezing: "気温が0℃になる高さの目安です。",
            temperature: "現在の時間帯の気温です。下に今日の最高気温と最低気温を表示します。",
            windSpeed: "地上10mの平均風速です。風向とビューフォート風力階級も表示します。",
            windGust: "地上10mの最大瞬間風速です。突風率は「最大瞬間風速 ÷ 平均風速」です。",
            precipProb: "現在の時間帯に雨が降る確率です。「最大」は今後24時間で最も高い値です。",
        },

        tendency: {
            risingFast: "急上昇",
            rising: "上昇",
            steady: "ほぼ変化なし",
            falling: "下降",
            fallingFast: "急下降",
        },

        uvLevels: {
            low: "弱い",
            moderate: "中程度",
            high: "強い",
            veryHigh: "非常に強い",
            extreme: "極めて強い",
        },

        wbgtLevels: {
            safe: "ほぼ安全",
            caution: "注意",
            warning: "警戒",
            severe: "厳重警戒",
            danger: "危険",
        },

        capeLevels: {
            negligible: "ごく小さい",
            weak: "弱い",
            moderate: "中程度",
            strong: "強い",
            extreme: "極めて強い",
        },

        wind: {
            title: "風",
            from: "風向き",
            gust: "突風",
            gustFactor: "突風の強さの割合",
            beaufort: "風力",
            dailyMax: "今日の最大風速 / 最大突風",
            dominant: "よく吹く風向き",
            names: [
                "静穏",
                "至軽風",
                "軽風",
                "軟風",
                "和風",
                "疾風",
                "雄風",
                "強風",
                "疾強風",
                "大強風",
                "全強風",
                "暴風",
                "颶風",
            ],
        },

        celestial: { more: "詳細", less: "閉じる" },
        sun: {
            title: "太陽",
            sunrise: "日の出",
            sunset: "日の入り",
            solarNoon: "太陽が最も高くなる時刻",
            daylight: "昼の長さ",
            tomorrow: "明日",
            sunshine: "日差しの時間（予報）",
            altitude: "高さ",
            max: "最大",
            azimuth: "方角",
            civil: "薄明の始まり・終わり",
            golden: "ゴールデンアワー",
        },

        moon: {
            title: "月",
            moonrise: "月の出",
            moonset: "月の入り",
            phase: "月の形",
            illumination: "月の明るさ",
            age: "月齢",
            days: "日",
            visible: "月が見える時間",
            nextFull: "次の満月",
            names: {
                new: "新月",
                waxingCrescent: "三日月",
                firstQuarter: "上弦の月",
                waxingGibbous: "満月に近づく月",
                full: "満月",
                waningGibbous: "満月を過ぎた月",
                lastQuarter: "下弦の月",
                waningCrescent: "細くなった月",
            },
        },

        charts: {
            temperature: "気温と露点",
            humidity: "湿度と雲の量",
            pressure: "気圧",
            wind: "風速と突風",
            precip: "雨の量と降水確率",
            instability: "紫外線と雷雨の発生しやすさ",
        },

        week: {
            date: "日付",
            daylight: "昼の長さ",
            sunshine: "日差し",
        },

        outlook: {
            title: "今後24時間",
            rainStarts: "雨が降り始める時刻",
            rainStops: "雨がやむ時刻",
            dry: "雨",
            dryValue: "雨は降らない見込み",
            gust: "最大突風",
            uv: "紫外線のピーク",
            high: "最高気温",
            low: "最低気温",
        },

        edit: {
            enter: "編集",
            done: "完了",
            add: "モジュールを追加",
            reset: "配置を初期状態に戻す",
            resetConfirm: "もう一度クリックで実行",
            needWide: "配置を編集するにはウィンドウを広げてください",
            noSpace: "空きがありません。先にモジュールを小さくするか、削除してください。",
            modules: {
                tile: "タイル",
                card: "チャートカード",
                hero: "現在の天気",
                alerts: "アラート",
                outlook: "今後24時間",
                wind: "風",
                sun: "太陽と月",
                week: "7日間の一覧",
                hourly: "時間ごとのデータ",
            },
            settings: {
                title: "設定",
                configure: "モジュールの設定",
                close: "閉じる",
                remove: "モジュールを削除",
                removeConfirm: "削除する？",
                soon: "このモジュールには、まだ設定項目がありません。今後追加予定です。",
                metric: "指標",
                display: "表示",
                displays: { graph: "グラフ", gauge: "ゲージ" },
                cardTitle: "タイトル",
                cardTitleAuto: "自動（指標名から作成）",
                metrics: "指標",
                addMetric: "指標を追加",
                removeMetric: "指標を削除",
                styles: { line: "折れ線", area: "面", bar: "棒", gauge: "ゲージ" },
                axisHint:
                    "チャートに表示できる単位は同時に2種類までです（左軸・右軸）。ゲージには制限がありません。",
            },
        },
        units: {
            title: "単位",
            metric: "メートル法",
            imperial: "ヤード・ポンド法",
            wind: "風速の単位",
            windNames: {
                ms: "m/s",
                kmh: "km/h",
                mph: "mph",
                kn: "ノット",
            },
        },

        detail: {
            close: "閉じる",
            min: "最低",
            mean: "平均",
            max: "最高",
            chart: {
                resetZoom: "拡大をリセット",
                zoomHint: "ドラッグで拡大、ダブルクリックで元に戻す",
            },
        },

        alerts: {
            title: "通知の条件",
            help: "現在の1時間と今後48時間の予報を確認します。条件に合う場合は通知を表示し、関連する項目を強調します。",
            enabled: "有効",
            add: "条件を追加",
            remove: "削除",
            close: "閉じる",
            now: "現在",
            none: "通知はありません",
            from: "開始",
            metrics: {
                temperature: "気温",
                feelsLike: "体感温度",
                wbgt: "暑さ指数（推定）",
                windSpeed: "風速",
                windGust: "突風",
                precipMm: "雨の量",
                precipProb: "雨の確率",
                humidity: "湿度",
                uv: "紫外線",
                cape: "雷雨の発生しやすさ",
                visibility: "見通し",
                pressure: "気圧",
            },
        },
    },

    settings: {
        title: "設定",
        autoSave: "自動保存しました",
        close: "設定を閉じる",

        status: {
            loading: "設定を読み込み中...",
            loadFailed: "設定を読み込めませんでした。",
            contentFailed: "設定を表示できませんでした。",
        },

        sidebar: {
            interface: "画面設定",
            dashboard: "ダッシュボード",
            modules: "ウィジェット",
            users: "ユーザー管理",
            about: "アプリについて",
        },

        interface: {
            title: "画面設定",
            description: "画面の見た目や表示言語を設定します。",

            language: {
                title: "言語",
                description: "画面に表示する言語を選びます。",
                add: "言語を追加",
            },

            appearance: {
                title: "見た目",
                description: "テーマや画面の表示方法を設定します。",
                current: "現在のテーマ",

                themes: {
                    title: "テーマ",
                    description: "テーマを管理します。",
                    builtIn: "既定のテーマ",
                    custom: "カスタムテーマ",
                    apply: "適用",
                    create: "作成",
                    edit: "編集",
                    delete: "削除",
                },

                customization: {
                    title: "カスタマイズ",
                    description: "色・文字・枠線・影などを調整します。",
                    colors: "色",
                    typography: "文字",
                    borders: "枠線",
                    effects: "効果",
                },

                dialog: {
                    titleCreate: "テーマを作成",
                    titleEdit: "テーマを編集",
                    builtInNote:
                        "既定のテーマは直接編集できません。コピーしてからカスタマイズしてください。",
                    builtInAdminNote:
                        "既定のテーマです。管理者は編集できますが、削除はできません。",
                    nameLabel: "テーマ名",
                    cancel: "キャンセル",
                    save: "保存",
                    saving: "保存中...",
                    saveFailed: "テーマを保存できませんでした。",
                    defaultName: "{name}のコピー",
                    customName: "カスタム",
                    pickColor: "色を選ぶ",
                    pickColorFor: "「{label}」の色を選ぶ",
                    switchTo: "{format}に切り替え",
                    delete: "削除",
                    deleteFailed: "テーマを削除できませんでした。",

                    mode: {
                        label: "カスタマイズ方法",
                        normal: "基本設定",
                        advanced: "詳細設定",
                        normalHint: "基本となる色を選ぶだけで、濃淡を自動で作成します。",
                        advancedHint: "透明度も含め、すべての色を個別に調整できます。",
                    },

                    normal: {
                        regenNote:
                            "ここで色を変更すると、すべての濃淡が自動で作り直されます。細かい調整は「詳細設定」で行ってください。",
                        baseTitle: "基本の色",
                        dark: "ダーク",
                        light: "ライト",
                        colorsTitle: "メインカラー",
                        accent: "アクセントカラー",
                        background: "背景",
                        text: "文字",
                        surprise: "おまかせ",
                        statusTitle: "状態を表す色",
                        success: "成功",
                        warning: "警告",
                        error: "エラー",
                        tuningTitle: "細かく調整",
                        reset: "元に戻す",
                        contrast: "背景の明暗差",
                        border: "枠線の強さ",
                        shadow: "影の濃さ",
                        shadesTitle: "自動で作成した色",
                    },

                    advanced: {
                        autoShade: "基本の色から濃淡を自動で作る",
                        regenerate: "すべての濃淡を作り直す",
                        base: "基本の色",
                        linked: "{base}に合わせて自動調整",
                        unlinked: "手動で調整済み — クリックすると{base}に合わせます",
                        alpha: "透明度",
                    },

                    groups: {
                        accent: "アクセントカラー",
                        surface: "背景",
                        element: "画面の部品",
                        border: "枠線",
                        text: "文字",
                        input: "入力欄",
                        status: "状態表示",
                        shadows: "影",
                    },

                    preview: {
                        title: "プレビュー",
                        appName: "CoEfficient",
                        appSubtitle: "ダッシュボード",
                        weatherTitle: "天気",
                        weatherHint: "晴れ時々曇り",
                        scheduleTitle: "スケジュール",
                        eventOne: "朝会",
                        eventTwo: "デザインの確認",
                        badgeSuccess: "完了",
                        badgeWarning: "まもなく",
                        badgeError: "期限超過",
                        textPrimary: "メインの文字",
                        textSecondary: "補助の文字",
                        textMuted: "薄い文字",
                        inputPlaceholder: "ここに入力",
                        secondaryButton: "キャンセル",
                        primaryButton: "保存",
                    },
                },
            },

            location: {
                title: "場所",
                description: "天気などに使用する場所を管理します。",

                current: {
                    title: "初期設定の場所",
                    description: "最初に表示する場所を選びます。",
                },

                add: "場所を追加",
                empty: "登録された場所はありません。",
                deleteTitle: "場所を削除しますか？",
                deleteMessage:
                    "「{name}」をすべてのユーザーから削除します。一度削除すると元に戻せません。",
                deleteConfirm: "削除",

                dialog: {
                    titleAdd: "場所を追加",
                    titleEdit: "場所を編集",

                    mode: {
                        search: "場所を検索",
                        coordinates: "座標を入力",
                    },

                    search: {
                        label: "検索",
                        description: "都市や場所を検索して、緯度・経度を取得します（英語のみ）。",
                        placeholder: "Tokyo",
                        button: "検索",
                        searching: "検索中...",
                        noResults: "場所が見つかりませんでした。",
                        failed: "場所を検索できませんでした。",
                    },

                    name: {
                        label: "場所の名前",
                        description: "入力は任意です。空欄の場合は座標から自動で設定します。",
                        placeholder: "座標から自動入力",
                    },

                    latitude: {
                        label: "緯度",
                        required: "緯度を入力してください。",
                        invalidNumber: "緯度は数値で入力してください。",
                        outOfRange: "緯度は -90 から 90 の範囲で入力してください。",
                    },

                    longitude: {
                        label: "経度",
                        required: "経度を入力してください。",
                        invalidNumber: "経度は数値で入力してください。",
                        outOfRange: "経度は -180 から 180 の範囲で入力してください。",
                    },

                    gps: {
                        button: "現在地を取得",
                        locating: "現在地を取得中...",
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
            description: "新しいダッシュボードの初期レイアウトを設定します。",

            layout: {
                title: "レイアウト",
                description: "列数や間隔などを設定します。",
                columns: "列の数",
                rows: "行の数",
                gap: "間隔",
                padding: "内側の余白",
            },

            moduleDefaults: {
                title: "ウィジェットの初期設定",
                description: "ウィジェットを追加したときの初期設定です。",
            },
        },

        modules: {
            title: "ウィジェット",
            description: "ウィジェットの初期設定を管理します。",
            available: "ウィジェットを追加",
            availableDescription: "追加するウィジェットを選びます。",
            current: "現在のウィジェット",
            currentDescription: "ダッシュボードに配置されているウィジェットです。",
            empty: "ウィジェットがありません。上から追加してください。",
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
                label: "マスの大きさ",
                width: "幅",
                height: "高さ",
            },

            position: {
                title: "配置",
                description:
                    "ダッシュボードを縮小して表示します。ウィジェットをクリックすると設定を開けます。ドラッグで移動し、端や角をドラッグするとサイズを変更できます。",
                gridLabel: "配置用グリッド",
                cellApprox: "1マス ≈",
                hint: "クリックで設定、ドラッグで移動、端や角をドラッグでサイズ変更",
                selectedHint: "置きたいマスをクリックしてください。",
                occupied: "その場所には別のウィジェットが置かれています。",
                outOfBounds: "その場所にはウィジェットを配置できません。",
                moveFailed: "ウィジェットを移動できませんでした。もう一度お試しください。",
                resizeHint: "ウィジェットの端や角をドラッグするとサイズを変更できます。",
                resizeBlocked: "これ以上その方向には広げられません。",
                resizeFailed:
                    "ウィジェットのサイズを変更できませんでした。もう一度お試しください。",
                resizeWidth: "幅を変更",
                resizeHeight: "高さを変更",
                resizeBoth: "サイズを変更",
                remove: "ウィジェットを削除",
                removeConfirm: "削除しますか？",
                removeYes: "削除",
                removeNo: "キャンセル",
                removeFailed: "ウィジェットを削除できませんでした。もう一度お試しください。",
                deleteMode: "ウィジェットを削除",
                deleteModeDone: "完了",
                deleteHint: "削除するウィジェットをクリックして、確認してください。",
                deleteConfirm: "{name}をダッシュボードから削除しますか？",
            },

            moduleSettings: {
                location: "場所",
                station: "駅・バス停",
                direction: "方面",
                display: "表示方法",
                views: {
                    board: "発車一覧",
                    line: "路線図",
                },
                noOptions: "このウィジェットには設定がありません。",
                move: "移動",
                done: "完了",
            },
        },

        users: {
            title: "ユーザー管理",
            description: "ユーザーと権限を管理します。",

            addUser: {
                title: "ユーザーを追加",
                usernameLabel: "ユーザー名",
                usernamePlaceholder: "例: jsmith",
                passwordLabel: "パスワード",
                passwordPlaceholder: "仮パスワード",
                roleLabel: "権限",
                submit: "ユーザーを作成",
                submitting: "作成中...",
                validationError: "ユーザー名とパスワードを入力してください。",
                genericError: "ユーザーを作成できませんでした。",
            },

            allUsers: {
                title: "すべてのユーザー",
                loading: "読み込み中...",
                joined: "登録日：{date}",
            },

            roles: {
                user: "一般ユーザー",
                manager: "マネージャー",
                admin: "管理者",
            },

            delete: {
                title: "ユーザーを削除",
                confirm: "「{username}」を削除しますか？この操作は取り消せません。",
                genericError: "ユーザーを削除できませんでした。",
            },

            setPassword: {
                title: "パスワードを変更",
                buttonTitle: "パスワードを変更",
                description: "「{username}」の新しいパスワードを設定します。",
                newPasswordLabel: "新しいパスワード",
                newPasswordPlaceholder: "8文字以上",
                confirmPasswordLabel: "パスワードの確認",
                confirmPasswordPlaceholder: "もう一度入力してください",
                submit: "パスワードを変更",
                submitting: "保存中...",
                cancel: "キャンセル",
                validationErrorLength: "パスワードは8文字以上で入力してください。",
                validationErrorMismatch: "パスワードが一致しません。",
                genericError: "パスワードを変更できませんでした。",
                successToast: "「{username}」のパスワードを変更しました。",
            },
        },

        about: {
            title: "アプリについて",
            description: "アプリの情報とクレジットを表示します。",
            versionTitle: "バージョン",

            stack: {
                title: "使用技術",
                description: "このアプリで使用しているサービスや技術です。",
                roles: {
                    frontend: "フロントエンド",
                    backend: "バックエンド",
                    runtime: "実行環境",
                    database: "データベース",
                    hosting: "ホスティング",
                    "database hosting": "データベースのホスティング",
                },
            },

            resetSectionTitle: "設定をリセット",
            resetSectionDescription: "すべての設定を初期状態に戻します。",
            resetButton: "初期状態に戻す",
            resetTitle: "設定をリセットしますか？",
            resetMessage:
                "設定、テーマ、ウィジェットの初期設定が元に戻ります。この操作は取り消せません。",
            resetConfirm: "リセット",
        },
    },

    modules: {
        weather: {
            current: {
                wmoCode: "天気コード",
                high: "最高気温",
                low: "最低気温",
                humidity: "湿度",
                wind: "風速",
                precipitation: "雨の確率",
                loading: "読み込み中...",
                error: "天気を取得できませんでした。",
                noData: "天気データがありません。",
                retry: "再試行",
            },

            forecast: {
                title: "天気予報",
                updated: "更新：",
                hourly: "時間ごと",
                daily: "7日間",
                hourlyHint: "← カードを選ぶと表示する時間が変わります",
                dailyHint: "7日間の天気の変化",
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
                snow: "雪",
                showers: "にわか雨",
                thunderstorm: "雷雨",
                calm: "風は穏やか",
            },

            metrics: {
                temp: "気温",
                humidity: "湿度",
                precipChance: "雨の確率",
                precipAmount: "雨の量",
                windSpeed: "風速",
                feelsLike: "体感温度",
                windGust: "突風",
                dewPoint: "露点",
                visibility: "見通し",
                uvIndex: "紫外線",
            },

            chart: {
                range: "表示範囲",
                max: "最高",
                min: "最低",
                feelsMax: "体感温度の最高",
                feelsMin: "体感温度の最低",
                school: "授業時間",
                now: "現在",
            },

            settings: {
                title: "天気の設定",
                back: "戻る",

                schoolHours: {
                    title: "授業時間（時間ごとのグラフに表示）",
                    start: "開始時刻",
                    end: "終了時刻",
                },

                layout: {
                    title: "表示方法",

                    combined: {
                        title: "まとめて表示",
                        description: "現在の天気と7日間の予報を表示します。",
                    },

                    current: {
                        title: "現在の天気",
                        description: "現在の天気だけを表示します。",
                    },

                    forecast: {
                        title: "天気予報のみ",
                        description: "7日間の予報とグラフを表示します。",
                    },
                },

                active: "● 有効",
                tip: "列の数はメイン設定から変更できます。",
            },

            header: {
                selectLocation: "場所を選ぶ",
                moduleSettings: "ウィジェットの設定",
                remove: "ダッシュボードから削除",
            },
        },

        clock: {
            am: "午前",
            pm: "午後",
            options: {
                title: "時計の設定",
                hour12: "12時間表示",
                showSeconds: "秒を表示",
                showDate: "日付を表示",
            },
        },

        transit: {
            header: {
                title: "電車・バス",
                changeStop: "駅・バス停を変更",
            },

            views: {
                toLine: "路線図を表示",
                toBoard: "発車一覧を表示",
            },

            options: {
                title: "路線図の設定",
                orientation: {
                    label: "向き",
                    horizontal: "横向き",
                    vertical: "縦向き",
                },
                colorMode: {
                    label: "色の表示",
                    mono: "白黒",
                    theme: "テーマに合わせる",
                },
                timer: {
                    label: "残り時間の表示",
                    seconds: "分と秒",
                    minutes: "分のみ",
                },
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

                tip: {
                    departs: "発車時刻",
                    type: "種別",
                    dest: "行き先",
                    line: "路線",
                },
            },

            dayTypes: {
                weekday: "平日",
                saturday: "土曜日",
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
            selectStop: "駅・バス停を選んでください。",
            stopMissing: "選択した駅・バス停は利用できません。別の場所を選んでください。",
            noStops:
                "駅・バス停が登録されていません。管理者に時刻表ファイルの追加を依頼してください。",

            status: {
                loading: "時刻表を読み込み中...",
                errorTitle: "時刻表を読み込めませんでした。",
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
                loading: "予定を読み込み中...",
                errorTitle: "予定を読み込めませんでした。",
                retry: "再試行",
            },
        },

        schedule: {
            header: {
                title: "スケジュール",
                subtitle: "予定・大切な日程",
                addEvent: "予定を追加",
                manageTags: "タグを管理",
                removeModule: "ウィジェットを削除",
                settings: "設定",
            },

            viewToggle: {
                absolute: "カレンダー表示",
                relative: "日数で表示",
            },

            layoutToggle: {
                month: "月表示",
                week: "週表示",
            },

            settings: {
                title: "スケジュールの設定",
                back: "閉じる",
                active: "有効",

                viewMode: {
                    title: "表示方法",

                    absolute: {
                        title: "カレンダー表示",
                        description: "月または週ごとに予定を表示します。",
                    },

                    relative: {
                        title: "日数で表示",
                        description: "今日を基準に、前後の日数で予定を表示します。",
                    },
                },

                layout: {
                    title: "レイアウト",

                    month: {
                        title: "月表示",
                        description: "1か月分の予定を表示します。",
                    },

                    week: {
                        title: "週表示",
                        description: "1週間分の予定を表示します。",
                    },
                },

                orientation: {
                    title: "週表示の向き",

                    horizontal: {
                        title: "横向き",
                        description: "各日を横長の行で表示し、予定の詳細を見やすくします。",
                    },

                    vertical: {
                        title: "縦向き",
                        description: "各日を縦の列に並べる、一般的なカレンダー表示です。",
                    },
                },
            },

            calendar: {
                today: "今日",
                weekOf: "週の開始日：",
                conflictTitle: "この時間には別の予定があります",
            },

            relative: {
                configureTitle: "表示する日数",
                settingsTitle: "日数表示の設定",
                daysBeforeLabel: "今日より前の日数：",
                windowHint: "前{before}日＋後{after}日（合計{total}日）",
                reset: "リセット",
            },

            dayList: {
                noEvents: "予定はありません。",
                addEvent: "予定を追加",
            },

            detail: {
                title: "予定の詳細",
                editedBy: "作成者：",
                lockNote: "編集できるのは、作成者または上位の権限を持つユーザーです。",
                edit: "編集",
                delete: "削除",
                close: "閉じる",
                confirmDelete: "この予定を削除しますか？",
            },

            form: {
                titleAdd: "予定を追加",
                titleEdit: "予定を編集",
                titleField: "タイトル *",
                titlePlaceholder: "例：チームの打ち合わせ",
                subtitleField: "サブタイトル",
                subtitlePlaceholder: "任意",
                dateField: "日付 *",
                timeField: "時間 *",
                tagsField: "タグ",
                tagPriorityHint: "最初のタグの色が予定に反映されます。",
                descriptionField: "詳細",
                descriptionPlaceholder: "補足情報などを入力してください...",
                addedBy: "作成者",
                cancel: "キャンセル",
                saveChanges: "変更を保存",
                addEvent: "予定を追加",
                delete: "削除",
                confirmDelete: "この予定を削除しますか？",
            },

            tagManager: {
                title: "タグの管理",
                namePlaceholder: "タグ名（例：会議）",
                add: "追加",
                noTags: "タグはありません。",
                deleteTitle: "タグを削除",
            },

            tagPicker: {
                noTagsHint: "タグはありません。管理者は「タグの管理」から追加できます。",
            },

            footer: {
                liveSync: "同期中",
            },

            status: {
                loading: "スケジュールを読み込み中...",
                errorTitle: "読み込みに失敗しました。",
                retry: "再試行",
            },
        },

        announcement: {
            header: {
                title: "お知らせ",
                activeNotices: "有効：",
                unread: "未読",
                create: "作成",
                viewerOnly: "閲覧のみ",
                viewArchive: "過去のお知らせ",
                compactView: "コンパクト表示",
                extendView: "詳細表示",
                removeModule: "ウィジェットを削除",
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
                emptyTitle: "お知らせはありません",
                emptyText: "条件に合うお知らせはありません。",
            },

            item: {
                unread: "未読",
                edited: "編集済み",
                edit: "編集",
                delete: "削除",
            },

            detail: {
                pinned: "上部に固定",
                edited: "編集済み",
                closeReader: "閉じる",
            },

            form: {
                titleEdit: "お知らせを編集",
                titleCreate: "お知らせを作成",
                titleField: "タイトル",
                titlePlaceholder: "例：空調設備のメンテナンスについて",
                categoriesField: "タグ・カテゴリ（複数選択可）",
                pinAutoHint: "※「緊急」を選ぶと自動で上部に固定されます。",
                pinManualHint: "お知らせを一覧の上部に固定します。",
                pinBulletin: "上部に固定",
                contentField: "本文",
                contentPlaceholder: "詳しい内容や指示、対応方法などを入力してください...",
                cancel: "キャンセル",
                update: "更新",
                publish: "公開",
            },

            archive: {
                title: "過去のお知らせ",
                empty: "保存された過去のお知らせはありません。",
                archivedOn: "保存日",
                restore: "元に戻す",
            },

            footer: {
                liveFeed: "同期中",
            },

            toast: {
                updated: "お知らせを更新しました。",
                published: "お知らせを公開しました！",
                deleted: "お知らせを削除しました。",
                restored: "お知らせを元に戻しました。",
                saveFailed: "保存に失敗しました。",
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
            title: "ウィジェット",
            description: "ウィジェットの初期設定を管理します。",
            available: "ウィジェットを追加",
            availableDescription: "追加するウィジェットを選びます。",
            current: "現在のウィジェット",
            currentDescription: "ダッシュボードに配置されているウィジェットです。",
            empty: "ウィジェットがありません。上から追加してください。",
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
