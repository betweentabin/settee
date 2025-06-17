# Telepathy Vite Template

このプロジェクトは、Viteを使用したフロントエンド開発環境です。JavaScript、TypeScript、Sass、EJSテンプレートを用い、効率的で柔軟なビルドと開発プロセスを提供します。

## 必要要件
- Node.js: v18.0.0 以上

## 特徴
- **TypeScript** 対応: `vite-plugin-typescript`を利用して、TypeScriptでの開発が可能です。
- **EJS テンプレート**: `vite-plugin-ejs`により、EJSテンプレートを使用したHTMLの生成が可能です。
- **Sass グロブインポート**: `vite-plugin-sass-glob-import`により、Sassファイルでのグロブインポートが可能です。
- **アニメーション**: `animejs`を使用してリッチなアニメーションを実現します。

## パッケージバージョン
- **@splidejs/splide**: ^4.1.4
- **animejs**: ^3.2.2
- **glob**: ^11.0.0
- **sass-embedded**: ^1.71.0
- **vite**: ^5.4.8
- **vite-plugin-ejs**: ^1.7.0
- **vite-plugin-sass-glob-import**: ^4.0.0
- **vite-plugin-typescript**: ^1.0.4
- **typescript**: ^5.6.3

## ディレクトリ構成
- **src**: ソースファイルが格納されるディレクトリ（JavaScript、Sass、HTMLファイルなど）
- **dist**: ビルド後の出力先ディレクトリ

### 主なファイル
- `src/**/*.js`: JavaScriptエントリーポイント
- `src/assets/styles/pages/**/*.scss`: Sassエントリーポイント（アンダースコアで始まるファイルは除外）
- `src/**/*.html`: HTMLテンプレート

## スクリプトコマンド
- `pnpm run dev`: ローカル開発サーバーを起動（デフォルトポート3000）
- `pnpm run build`: 本番ビルドの実行
- `pnpm run build:cache-buster`: `CACHE_BUSTER=true`でキャッシュバスター付きビルドを実行

## ビルド構成
`vite.config.js`ファイルにビルド構成が定義されています。出力ファイルのディレクトリ構成は以下の通りです。
- **JSファイル**: `assets/[name].js`
- **画像ファイル**: `assets/img/[name].[ext]`
- **CSSファイル**: `assets/css/[name].[ext]`

## プラグイン
- **ViteEjsPlugin**: EJSテンプレートエンジンを使用可能にします。
- **sassGlobImports**: Sassファイルに対してグロブインポートをサポートします。
- **vite-plugin-typescript**: TypeScriptファイルのビルドと解析に対応。

## ローカル開発
開発サーバーは`localhost:3000`で実行されます。

```bash
# ローカルサーバーを起動
pnpm install
pnpm run dev
```

キャッシュバスター付きのビルドを実行する場合は以下のコマンドを使用します。

```bash
pnpm run build:cache-buster
```

## ビルド
プロジェクトの本番ビルドは以下のコマンドで実行できます。

```bash
pnpm run build
```

ビルド後、`dist`ディレクトリに出力が保存されます。
