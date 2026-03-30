# ActionTest — SCSS/EJS → S3 自動デプロイ

EJS と SCSS で書いたソースを `npm run build` でコンパイルし、
`main` ブランチに push するだけで **GitHub Actions が自動的に AWS S3 へデプロイ**するプロジェクトです。

---

## 目次

1. [このプロジェクトでできること](#このプロジェクトでできること)
2. [ディレクトリ構成](#ディレクトリ構成)
3. [使用技術](#使用技術)
4. [はじめかた（ローカル環境）](#はじめかたローカル環境)
5. [AWS の初期設定](#awsの初期設定)
6. [GitHub Secrets の設定](#github-secrets-の設定)
7. [自動デプロイの仕組み](#自動デプロイの仕組み)
8. [npm コマンド一覧](#npm-コマンド一覧)
9. [よくある質問](#よくある質問)

---

## このプロジェクトでできること

```
コードを編集して git push するだけ！

  ┌─────────────┐    push     ┌──────────────────┐    deploy    ┌─────────┐
  │  ローカルPC  │ ──────────► │  GitHub Actions  │ ───────────► │  AWS S3 │
  └─────────────┘             └──────────────────┘              └─────────┘
     EJS/SCSS を編集               自動でビルド                  静的サイト公開
```

- **EJS** で HTML をテンプレート化（共通パーツの使い回しが可能）
- **SCSS** で CSS を効率よく記述（変数・ネスト・ミックスインが使える）
- **GitHub Actions** でビルド〜デプロイを全自動化
- **AWS S3** の無料枠で静的サイトを公開

---

## ディレクトリ構成

```
ActionTest/
├── .github/
│   └── workflows/
│       └── deploy.yml           # GitHub Actions の設定ファイル
├── src/                         # ★ 編集するのはここ
│   ├── views/
│   │   ├── index.ejs            # トップページ
│   │   └── partials/            # 共通パーツ（全ページで使い回す部品）
│   │       ├── head.ejs         #   <head> タグの中身
│   │       ├── header.ejs       #   ヘッダー
│   │       ├── footer.ejs       #   フッター
│   │       └── actions-guide.ejs#   GitHub Actions 解説セクション
│   ├── scss/
│   │   └── main.scss            # スタイルシート
│   └── assets/
│       └── images/              # 画像ファイルを置く場所
├── scripts/
│   └── build-ejs.js             # EJS → HTML に変換するスクリプト（自動実行）
├── dist/                        # ビルド後の出力先（git管理外）
│   ├── index.html
│   ├── css/
│   │   └── main.css
│   └── assets/
├── package.json                 # npm の設定ファイル
├── .gitignore
└── README.md
```

> **ポイント:** `src/` の中を編集して `git push` するだけです。
> `dist/` は自動生成されるので、自分で触る必要はありません。

---

## 使用技術

| 技術 | 役割 |
|------|------|
| [EJS](https://ejs.co/) | HTMLテンプレートエンジン。`include()` で共通パーツを使い回せる |
| [Sass (SCSS)](https://sass-lang.com/) | CSSの拡張言語。変数やネストが使えて保守しやすい |
| [GitHub Actions](https://github.com/features/actions) | コードのpush時にビルド&デプロイを自動実行 |
| [AWS S3](https://aws.amazon.com/jp/s3/) | 静的ウェブサイトのホスティング。無料枠あり |

---

## はじめかた（ローカル環境）

### 前提条件

- [Node.js](https://nodejs.org/) v18 以上がインストールされていること
- [Git](https://git-scm.com/) がインストールされていること

確認方法:
```bash
node -v   # v18.0.0 以上が表示されればOK
git -v    # バージョンが表示されればOK
```

### セットアップ

```bash
# 1. リポジトリをクローン
git clone https://github.com/YOUR_USER/YOUR_REPO.git
cd YOUR_REPO

# 2. パッケージをインストール
npm install

# 3. ビルドして動作確認
npm run build
```

`dist/` フォルダが生成されれば成功です。

---

## AWS の初期設定

> AWS アカウントを持っていない場合は先に[無料アカウントを作成](https://aws.amazon.com/jp/free/)してください。
> クレジットカードは必要ですが、無料枠内では課金されません。

### 手順1: S3 バケットを作成する

1. [AWS Console](https://console.aws.amazon.com/) にログイン
2. 上部の検索バーで「S3」と検索してクリック
3. 「バケットを作成」ボタンをクリック
4. 以下のように設定する:
   - **バケット名**: 世界で唯一の名前（例: `my-site-20260101`）
   - **リージョン**: `アジアパシフィック (東京) ap-northeast-1`
   - **パブリックアクセスのブロック**: 「パブリックアクセスをすべてブロック」の **チェックを外す**
   - 確認のチェックボックスにチェックを入れる
5. 「バケットを作成」をクリック

### 手順2: 静的ウェブサイトホスティングを有効にする

1. 作成したバケットをクリック
2. 「プロパティ」タブを選択
3. 一番下の「静的ウェブサイトホスティング」の「編集」をクリック
4. 「有効にする」を選択し、インデックスドキュメントに `index.html` を入力
5. 「変更の保存」をクリック

### 手順3: バケットポリシーを設定する（公開設定）

1. 「アクセス許可」タブを選択
2. 「バケットポリシー」の「編集」をクリック
3. 以下をコピーして貼り付ける（`YOUR-BUCKET-NAME` を自分のバケット名に変更）:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::YOUR-BUCKET-NAME/*"
    }
  ]
}
```

4. 「変更の保存」をクリック

### 手順4: IAM ユーザーを作成する（GitHub Actions 用）

GitHub Actions が S3 にアクセスするための「専用ユーザー」を作成します。

1. 上部の検索バーで「IAM」と検索してクリック
2. 左メニューの「ユーザー」→「ユーザーの作成」をクリック
3. **ユーザー名**: `github-actions-deploy`（任意）を入力
4. 「次へ」→「ポリシーを直接アタッチする」を選択
5. 検索欄に `AmazonS3FullAccess` と入力してチェックを入れる
6. 「次へ」→「ユーザーの作成」をクリック
7. 作成したユーザーをクリック→「セキュリティ認証情報」タブ
8. 「アクセスキーを作成」→「サードパーティサービス」を選択→「次へ」
9. 「アクセスキーを作成」をクリック
10. **アクセスキーID** と **シークレットアクセスキー** をメモしておく（この画面を閉じると二度と確認できません）

---

## GitHub Secrets の設定

メモしたキーを GitHub に安全に保存します。

1. GitHub のリポジトリページを開く
2. 「Settings」タブ → 左メニューの「Secrets and variables」→「Actions」
3. 「New repository secret」ボタンで以下の4つを登録する:

| Name（シークレット名） | Value（値） |
|------------------------|-------------|
| `AWS_ACCESS_KEY_ID` | IAM で発行したアクセスキーID |
| `AWS_SECRET_ACCESS_KEY` | IAM で発行したシークレットアクセスキー |
| `AWS_REGION` | `ap-northeast-1`（東京の場合） |
| `S3_BUCKET_NAME` | 作成した S3 バケット名 |

> **注意:** シークレットの値は登録後に確認できません。
> 間違えた場合は削除して再登録してください。

---

## 自動デプロイの仕組み

`.github/workflows/deploy.yml` に処理が定義されています。

```
main ブランチに push
        ↓
① リポジトリをチェックアウト（コードを取得）
        ↓
② Node.js をセットアップ
        ↓
③ npm ci（パッケージをインストール）
        ↓
④ npm run build
   ├── EJS → HTML に変換
   ├── SCSS → CSS に圧縮変換
   └── 画像などのアセットをコピー
        ↓
⑤ AWS 認証情報を設定（Secrets から読み込み）
        ↓
⑥ aws s3 sync で dist/ を S3 にアップロード
        ↓
デプロイ完了！
```

GitHub の「Actions」タブから実行ログをリアルタイムで確認できます。

---

## npm コマンド一覧

```bash
# 依存パッケージをインストール（初回・package.json更新時）
npm install

# ローカルサーバを起動して開発（★ 普段はこれだけでOK）
npm run dev

# ビルドのみ（dist/ を生成）
npm run build

# dist/ フォルダを削除
npm run clean
```

### `npm run dev` でできること

```
① npm run build でまず全ファイルをビルド
② ローカルサーバを起動 → http://localhost:3000 で確認できる
③ src/ 内のファイルを保存するたびに自動でビルド＋ブラウザをリロード
```

---

## よくある質問

**Q. `dist/` フォルダを git push していいですか？**
A. 不要です。`.gitignore` で除外済みです。GitHub Actions がビルドするので、`src/` だけ管理すれば OK です。

**Q. 新しいページを追加するには？**
A. `src/views/` に `.ejs` ファイルを追加するだけです。ビルド時に自動で `.html` に変換されます。

**Q. CSS の変更が S3 に反映されません**
A. ブラウザキャッシュが原因の場合があります。`Ctrl+Shift+R`（Macは `Cmd+Shift+R`）で強制リロードしてください。

**Q. GitHub Actions が失敗しました**
A. リポジトリの「Actions」タブでエラーログを確認してください。多くの場合、Secrets の設定ミスや S3 のバケットポリシー設定漏れが原因です。

**Q. S3 の URL はどこで確認できますか？**
A. AWS Console → S3 → バケット → 「プロパティ」タブ → 「静的ウェブサイトホスティング」の一番下に URL が表示されています。
