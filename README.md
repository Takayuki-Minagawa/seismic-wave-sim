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
| 地球断面アニメーション | P 波（青）・S 波（赤）の伝播を 60fps でリアルタイム描画 |
| シャドウゾーン表示 | P 波シャドウゾーン（103°–143°）・S 波シャドウゾーン（103°以遠）をビジュアル表示 |
| 走時曲線グラフ | 震央距離 vs 到達時間を D3.js でリアルタイム描画。到達済み点を動的にハイライト |
| 観測点管理 | 地球表面に最大複数の観測点を配置。各点の P/S/PKP 到達時刻・シャドウゾーン判定を表示 |
| 走時情報パネル | 選択した観測点の各波相到達時刻を一覧表示 |
| 地球内部構造パネル | 5 層モデルの速度・密度・深さ情報をテーブル表示 |
| 学習パネル | シミュレーション状態に連動した解説文と 4 択クイズ（全 4 問） |
| 地震プリセット | 2011 年東北・2004 年スマトラ・1960 年チリ地震データを自動設定 |
| 言語切替 | 日本語 / English をワンクリックで切替（i18next） |
| テーマ切替 | ライト / ダークモード対応 |
| レスポンシブ | PC（3 ペイン）・タブレット・スマートフォンに対応 |

---

## 操作方法

### 地球断面

| 操作 | 動作 |
|---|---|
| 地球表面をクリック / ドラッグ | 震源を移動（表面上 = 地表震源） |
| 地球内部をクリック | 深発地震として震源を設定 |
| 地球表面をダブルクリック | 観測点を追加 |
| 観測点をクリック | 観測点を選択（走時情報パネルに表示） |

### 走時曲線グラフ

| 操作 | 動作 |
|---|---|
| グラフをクリック | 指定した震央距離に観測点を追加 |

### コントロールパネル

| 項目 | 説明 |
|---|---|
| ▶ 再生 / ⏸ 一時停止 | アニメーションの開始・停止 |
| ↺ リセット | 経過時間を 0 秒に戻す |
| 震源深さ | 0 km〜700 km（スライダー） |
| マグニチュード | M 1.0〜M 9.0（スライダー、表示のみ） |
| 再生速度 | ×1 / ×2 / ×5 / ×10 |
| プリセット | 実際の大地震データで一括設定 |

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
│   │   └── useTheme.ts         # ライト / ダークテーマ管理
│   │
│   ├── components/
│   │   ├── earth/
│   │   │   ├── EarthCanvas.tsx     # Canvas ホスト・クリック / ドラッグ処理
│   │   │   ├── earthRenderer.ts    # 純粋描画関数群（rAF 内で呼び出し）
│   │   │   └── LayerLegend.tsx     # 地球層の色凡例
│   │   ├── graph/
│   │   │   └── TravelTimeGraph.tsx # D3.js 走時曲線グラフ
│   │   ├── info/
│   │   │   └── EarthInfoPanel.tsx  # 地球内部構造テーブル
│   │   ├── learning/
│   │   │   ├── LearningPanel.tsx   # 解説・クイズタブ切替
│   │   │   ├── QuizFrame.tsx       # クイズ問題 / 選択肢 / フィードバック UI
│   │   │   ├── quizBank.ts         # クイズ問題定義（日英）
│   │   │   └── explanationEngine.ts# SimulationState → 解説文生成
│   │   ├── layout/
│   │   │   ├── AppLayout.tsx       # CSS Grid 3 ペインレイアウト
│   │   │   ├── ControlPanel.tsx    # 再生制御・震源設定・プリセット
│   │   │   └── TopBar.tsx          # タイトル・言語 / テーマトグル
│   │   └── common/
│   │       ├── Slider.tsx
│   │       ├── Toggle.tsx
│   │       ├── IconButton.tsx
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
├── tailwind.config.js
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

**各層内の積分:**
```
dθ/dr = p / (r · √(r²/v² − p²))   ← 角度変化
dt/dr  = 1 / (v · √(1 − p²v²/r²)) ← 時間変化
```

シンプソン則で数値積分し、下降段階・折返し・上昇段階を対称的に計算します。震源深さに応じた発射角 0.5°〜89.5° を 0.5° 刻み（180 本）でファン状に発射します。

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
