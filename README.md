# Seismic Wave Simulator — 地震波と地球内部構造シミュレーター

P 波・S 波が地球内部をどのように伝わるかをリアルタイムで可視化する、高校地学向けの教育用 Web アプリケーションです。

**Live Demo:** https://takayuki-minagawa.github.io/seismic-wave-sim/

---

## 概要

地震波（P 波・S 波）の地球内部伝播をインタラクティブに学べるシミュレーターです。スネルの法則に基づく数値レイトレーシングを用いて波線経路を計算し、地球断面アニメーションと走時曲線グラフで同時に表示します。日本語・英語に対応し、スマートフォンでも動作します。

**対象:** 高校地学基礎・地学（地震波の伝播・走時曲線・地球内部構造）

---

## 主な機能

| 機能 | 説明 |
|---|---|
| 地球断面アニメーション | 宇宙に浮かぶ地球の断面上で、P 波（青）・S 波（赤）・PKP 波（紫）の伝播を 60fps で描画。地震発生時の画面の揺れ・震源の閃光つき |
| 震央距離の目盛り | 30° ごとの目盛りと、シャドウゾーン境界（103°・143°）を地表に表示 |
| 地震計（セイスモグラム） | 選択した観測点の揺れをリアルタイムに記録。P・S 到着マーカーと初期微動継続時間（S−P 時間）を表示 |
| 走時曲線グラフ | 震央距離 vs 走時を D3.js で描画。「いま」の時刻線、観測点の到着点を重ねて表示 |
| ミッション & ランク | 13 個のミッション（P 波キャッチ、S 波の影を発見、PKP 波観測など）をクリアして XP を集め、「地震学見習い」→「地球物理学博士」へランクアップ。進捗はブラウザに保存 |
| 到着通知・効果音 | 観測点に波が届くとトースト通知とサウンド。ミッション達成時は紙吹雪。効果音はワンクリックでミュート可能 |
| ナマズ博士の解説 | シミュレーションの状況に応じて解説が変わるガイドキャラクター |
| クイズ | 全 8 問。連続正解ボーナス表示、満点でミッション達成 |
| 地球内部構造パネル | 5 層の厚さ・密度・P/S 波速度をバーで比較。全層を調べるとミッション達成 |
| 地震プリセット | 2011 年東北・2004 年スマトラ・1960 年チリ地震を再現 |
| はじめてガイド | 初回訪問時に 3 ステップの遊び方を表示（「?」ボタンで再表示） |
| 言語切替 | 日本語 / English をワンクリックで切替（i18next） |
| テーマ切替 | 宇宙をイメージしたダークテーマ（既定）/ ライトテーマ |
| レスポンシブ | PC（3 ペイン）・タブレット / スマートフォン（下部タブ）に対応 |

---

## 操作方法

### 地球断面

| 操作 | 動作 |
|---|---|
| 「💥 地震を起こす！」ボタン | 地震を発生させる（再生中は一時停止、終了後はもう一度） |
| 地球をクリック / ドラッグ | 震源を移動（地表付近 = 深さはそのまま、内部 = 深発地震として深さも設定） |
| 地表をダブルクリック / ダブルタップ | 観測点を追加 |
| 観測点をクリック | 観測点を選択（地震計に表示） |

### コントロールパネル

| 項目 | 説明 |
|---|---|
| 早送り | ×10 / ×30（既定）/ ×60 / ×120。×30 なら約 1 分で全ての波が地表に届きます |
| 震源の深さ | 0 km〜700 km（浅発 / やや深発 / 深発を表示） |
| マグニチュード | M 1.0〜M 9.5（波の明るさ・揺れの大きさに反映） |
| 歴史的な大地震 | 実際の大地震データで一括設定 |

---

## ローカル開発

### 動作要件

- Node.js 20 以上
- npm 10 以上

### セットアップ

```bash
git clone https://github.com/Takayuki-Minagawa/seismic-wave-sim.git
cd seismic-wave-sim
npm install
npm run dev
```

ブラウザで `http://localhost:5173/seismic-wave-sim/` を開いてください。

### 主要コマンド

```bash
npm run dev       # 開発サーバー起動（HMR 有効）
npm run build     # TypeScript コンパイル + Vite プロダクションビルド
npm run lint      # ESLint 実行
npm run preview   # ビルド済み dist をローカルプレビュー
```

---

## 技術スタック

| カテゴリ | ライブラリ / ツール | バージョン |
|---|---|---|
| UI フレームワーク | React | ^19 |
| 言語 | TypeScript | ~6.0 |
| ビルドツール | Vite + `@vitejs/plugin-react` | ^8.0 |
| スタイリング | Tailwind CSS v4 (`@tailwindcss/vite`) | ^4.2 |
| グラフ描画 | D3.js | ^7.9 |
| 多言語対応 | i18next + react-i18next + i18next-browser-languagedetector | ^26 |
| 静的解析 | ESLint + typescript-eslint + eslint-plugin-react-hooks | ^9 |
| CI / CD | GitHub Actions → GitHub Pages | — |

---

## プロジェクト構成

```
seismic-wave-sim/
├── .github/
│   └── workflows/
│       └── deploy.yml          # GitHub Actions: lint → build → Pages deploy
├── public/
│   ├── favicon.svg
│   └── icons.svg               # UI アイコンスプライト（SVG symbol）
├── src/
│   ├── main.tsx                # React エントリーポイント
│   ├── App.tsx                 # ルートコンポーネント・レイアウト結合
│   │
│   ├── data/
│   │   ├── earthModel.ts       # 5 層速度モデル定数・レイヤー検索ユーティリティ
│   │   └── presets.ts          # 地震プリセット定義（東北・スマトラ・チリ）
│   │
│   ├── physics/
│   │   ├── types.ts            # 全型定義（EarthLayer, Ray, SimulationState 等）
│   │   ├── constants.ts        # 物理定数（地球半径、DEG_TO_RAD 等）
│   │   ├── rayTracer.ts        # スネルの法則レイトレーシングエンジン
│   │   ├── travelTimeCalc.ts   # 走時曲線データ生成・補間
│   │   ├── shadowZone.ts       # シャドウゾーン判定・PKP 有効性チェック
│   │   └── wavefront.ts        # 時刻 t での波面先端位置計算
│   │
│   ├── hooks/
│   │   ├── useSimulation.ts    # メインシミュレーション状態管理（useReducer + rAF）
│   │   ├── useTravelTimeData.ts# 走時グラフ向けデータ導出（useMemo）
│   │   ├── useMediaQuery.ts    # 表示中のレイアウトだけをマウント
│   │   └── useTheme.ts         # ライト / ダークテーマ管理
│   │
│   ├── game/
│   │   ├── missions.ts         # ミッション定義・ランク・進捗ストア（localStorage）
│   │   ├── toastStore.ts       # トースト通知ストア・紙吹雪イベント
│   │   ├── sound.ts            # Web Audio による効果音（音声ファイル不要）
│   │   ├── storage.ts          # 例外を出さない localStorage ヘルパー
│   │   └── hooks.ts            # 上記ストアの React フック
│   │
│   ├── components/
│   │   ├── earth/
│   │   │   ├── EarthStage.tsx      # 断面図 + HUD（時計・状態・ヒント・凡例・地震ボタン）
│   │   │   ├── EarthCanvas.tsx     # Canvas ホスト・ポインター操作（クリック / ドラッグ / ダブルタップ）
│   │   │   ├── earthRenderer.ts    # 純粋描画関数群（rAF 内で呼び出し）
│   │   │   └── WaveLegend.tsx      # 波・シャドウゾーンの凡例
│   │   ├── seismo/
│   │   │   └── Seismogram.tsx      # 観測点の地震計記録（S−P 時間表示）
│   │   ├── graph/
│   │   │   └── TravelTimeGraph.tsx # D3.js 走時曲線グラフ
│   │   ├── game/
│   │   │   ├── MissionPanel.tsx    # ミッション一覧・ランクカード
│   │   │   ├── ToastStack.tsx      # 到着 / 達成通知
│   │   │   ├── Confetti.tsx        # 紙吹雪
│   │   │   └── WelcomeOverlay.tsx  # はじめてガイド
│   │   ├── info/
│   │   │   └── EarthInfoPanel.tsx  # 地球内部構造カード
│   │   ├── learning/
│   │   │   ├── LearningPanel.tsx   # ナマズ博士の解説・波の基本
│   │   │   ├── QuizFrame.tsx       # クイズ問題 / 選択肢 / フィードバック UI
│   │   │   ├── quizBank.ts         # クイズ問題定義（日英）
│   │   │   └── explanationEngine.ts# SimulationState → 解説文生成
│   │   ├── layout/
│   │   │   ├── AppLayout.tsx       # 3 ペイン（PC）/ 下部タブ（モバイル）レイアウト
│   │   │   ├── ControlPanel.tsx    # 地震ボタン・早送り・震源設定・プリセット・観測点
│   │   │   ├── SidePanel.tsx       # ミッション / 解説 / クイズ / 構造タブ
│   │   │   ├── AnalysisPanel.tsx   # 地震計 + 走時曲線
│   │   │   ├── TabBar.tsx
│   │   │   └── TopBar.tsx          # タイトル・ランク・効果音 / 言語 / テーマ
│   │   └── common/
│   │       ├── QuakeButton.tsx     # 「地震を起こす！」ボタン
│   │       ├── Slider.tsx
│   │       └── ShadowZoneBadge.tsx # シャドウゾーン警告バッジ
│   │
│   ├── i18n/
│   │   ├── index.ts            # i18next 初期設定
│   │   ├── ja.json             # 日本語リソース
│   │   └── en.json             # 英語リソース
│   │
│   └── utils/
│       ├── geometry.ts         # 極座標 ↔ Canvas 座標変換
│       ├── colorScale.ts       # 振幅 → 不透明度マッピング
│       └── formatters.ts       # 時間・距離・速度フォーマット
│
├── index.html
├── vite.config.ts              # base: '/seismic-wave-sim/', tailwindcss プラグイン
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.node.json
├── eslint.config.js
└── package.json
```

---

## 物理エンジン

### 地球速度モデル（5 層簡易モデル）

高校教科書レベルで扱われる代表的な値を採用した教育用簡易モデルです。

| 層 | 外側半径 (km) | 内側半径 (km) | P 波速度 (km/s) | S 波速度 (km/s) | 密度 (g/cm³) |
|---|---:|---:|---:|---:|---:|
| 地殻 | 6371 | 6341 | 6.0 | 3.5 | 2.9 |
| 上部マントル | 6341 | 5971 | 8.0 | 4.5 | 3.5 |
| 下部マントル | 5971 | 3471 | 13.0 | 7.0 | 4.9 |
| 外核（液体） | 3471 | 1221 | 9.0 | — | 10.9 |
| 内核 | 1221 | 0 | 11.0 | 3.5 | 13.0 |

> 外核は液体のため S 波を伝えません（S 波シャドウゾーンの原因）。

### レイトレーシング（`physics/rayTracer.ts`）

球殻のスネルの法則（レイパラメータ保存則）を用いた数値積分で波線を計算します。

**レイパラメータ:**
```
p = r · sin(i) / v(r)
```
> r = 震源からの半径（km）、i = 下向き鉛直からの入射角、v = 各層の速度

**各層内の計算:**

各層の速度は一定なので、層内の波線は直線になります。その直線が地球中心に最も近づく距離は b = p·v です。半径 r₁ から r₂ までの区間は次の厳密解で求めます。
```
Δθ = |acos(b/r₂) − acos(b/r₁)|           ← 角度変化
Δt = |√(r₂² − b²) − √(r₁² − b²)| / v     ← 時間変化
```

下降段階・折返し・上昇段階を対称的に計算します。速い層へ臨界角を超えて入射した波線は、その境界で折り返します。震源深さに応じた発射角 0.5°〜89.5° を 0.5° 刻み（180 本）でファン状に発射します。

**波相分類:**
- **P 波:** マントルのみを通過
- **S 波:** マントルのみを通過（外核に達した時点で吸収）
- **PKP:** P 波が外核・内核を通過して再び地表に現れる波

### シャドウゾーン（`physics/shadowZone.ts`）

教科書の定義値を固定定数として使用します。

| ゾーン | 開始 | 終了 |
|---|---|---|
| P 波シャドウゾーン | 103° | 143° |
| S 波シャドウゾーン | 103° | 180° |

PKP 波は 143° 以遠でのみ表示されます。

### 走時曲線（`physics/travelTimeCalc.ts`）

レイファンの計算結果から走時曲線データを構築します。補間時は隣接サンプル間の距離が 15° を超える場合に `null` を返し、シャドウゾーンをまたぐ不正な補間を防ぎます。

---

## アーキテクチャ

### 状態管理

`useSimulation` フックが `useReducer` で単一の `SimulationState` を管理します。Redux などの外部ライブラリは使用しません。

```
SimulationState
├── epicenter          震源設定（角度・深さ・マグニチュード）
├── observers[]        観測点リスト（各点の到達情報・シャドウゾーン判定）
├── rays[]             全波線データ（レイトレーシング結果）
├── travelTimeCurve[]  走時曲線データ
├── shadowZone         シャドウゾーン境界情報
├── currentTimeSec     現在の経過時間（秒）
├── isPlaying          再生状態
└── speedMultiplier    再生速度倍率
```

### Canvas アニメーションループ

Canvas 描画は React のレンダリングサイクルから完全に分離されています。

```
useEffect（mount 時のみ）
  └── requestAnimationFrame ループ
        ├── stateRef.current を参照（最新の SimulationState）
        └── earthRenderer.ts の純粋描画関数を呼び出し
```

`stateRef` は `useLayoutEffect` でレンダー後に同期します（レンダー中の ref 書き込みを回避）。これにより React の再レンダーを一切トリガーせず 60fps を維持します。

### 走時グラフ（D3.js）

`TravelTimeGraph` コンポーネントは D3 の `enter/update/exit` パターンで DOM を直接操作します。クリックイベントは React の `onClick` プロップ経由で処理し、D3 スケールは `useRef` に保持します（`addEventListener` の蓄積を防ぐため）。

### 多言語対応（i18n）

`i18next-browser-languagedetector` でブラウザ言語を自動検出し、`ja` / `en` にフォールバックします。翻訳キーは `src/i18n/ja.json` と `src/i18n/en.json` で管理します。

---

## CI / CD

`.github/workflows/deploy.yml` によって `main` ブランチへの push 時に以下が自動実行されます。

```
push to main
  └── build ジョブ
        ├── npm ci           依存関係インストール
        ├── npm run lint     ESLint チェック
        ├── npm run build    TypeScript コンパイル + Vite ビルド
        └── Pages artifact アップロード
  └── deploy ジョブ（build 完了後）
        └── GitHub Pages へデプロイ
```

リポジトリ設定の **Settings → Pages → Source** を `GitHub Actions` に変更することでデプロイが有効になります。

---

## TypeScript 型定義

主要な型は `src/physics/types.ts` で一元管理されています。

```typescript
// 地球層
interface EarthLayer {
  name: 'crust' | 'upperMantle' | 'lowerMantle' | 'outerCore' | 'innerCore';
  outerRadius: number;  // km
  innerRadius: number;  // km
  pVelocity: number;    // km/s
  sVelocity: number;    // km/s (0 = 液体・S 波吸収)
  color: string;
  darkColor: string;
  density: number;      // g/cm³
}

// 波相種別
type WavePhase = 'P' | 'S' | 'PP' | 'PKP' | 'SKS';

// レイセグメント（各層内の波線区間）
interface RaySegment {
  startRadius: number; endRadius: number;  // km
  startAngle:  number; endAngle:  number;  // radians
  velocity:    number;                      // km/s
  waveType:    'P' | 'S';
  layerName:   EarthLayer['name'];
  travelTime:  number;                      // seconds
}

// 波線
interface Ray {
  id:               string;
  takeoffAngleDeg:  number;
  segments:         RaySegment[];
  totalTravelTime:  number;        // seconds
  surfaceAngleDeg:  number;        // 震央距離（°）
  phase:            WavePhase;
  isAbsorbed:       boolean;
}

// 走時曲線の 1 点
interface TravelTimeDatum {
  distanceDeg: number;
  timeSec:     number;
  phase:       WavePhase;
}

// 観測点
interface ObserverPoint {
  id:              string;
  surfaceAngleDeg: number;  // 震央からの角度（°）
  label:           string;
  arrivals:        ObserverArrival[];
  inShadowZone:    { P: boolean; S: boolean };
}

// シミュレーション全体状態
interface SimulationState {
  epicenter:          EpicenterConfig;
  observers:          ObserverPoint[];
  rays:               Ray[];
  travelTimeCurve:    TravelTimeDatum[];
  shadowZone:         ShadowZoneInfo;
  currentTimeSec:     number;
  isPlaying:          boolean;
  speedMultiplier:    number;
  selectedObserverId: string | null;
}
```

---

## 教育モデルに関する注記

本アプリは教育目的の**簡易モデル**を採用しています。

- 速度モデルは 5 層均質モデルであり、実際の地球の連続的な速度勾配（PREM 等）は再現していません。
- シャドウゾーン境界（103° / 143°）は教科書の代表値であり、震源深さや実際の速度構造によって変化します。
- PP・SKS 等の反射・変換波は実装していません。
- 計算される走時は実測値と数分程度の誤差を生じることがあります。

研究・防災目的には専門の地震学データベースをご利用ください。

---

## ライセンス

このプロジェクトは [MIT License](LICENSE) のもとで公開されています。
