# 環境変数の設定ガイド

このプロジェクトでは、TurborepoでNext.jsとHono（Cloudflare Workers）の環境変数を管理しています。

## セットアップ

### 1. Hono（Cloudflare Workers）の環境変数

`apps/server/.dev.vars`ファイルをコピーして設定します：

```bash
cd apps/server
cp .dev.vars.example .dev.vars
# .dev.varsを編集して実際の値を設定
```

### 2. Next.jsの環境変数

`apps/web/.env.local`ファイルをコピーして設定します：

```bash
cd apps/web
cp .env.local.example .env.local
# .env.localを編集して実際の値を設定
```

## 開発サーバーの起動

```bash
# 両方のアプリケーションを同時に起動
pnpm turbo dev

# または個別に起動
pnpm --filter server dev    # Hono (http://localhost:8787)
pnpm --filter web dev       # Next.js (http://localhost:3000)
```

## 環境変数の使用方法

### Hono（Cloudflare Workers）での使用

```typescript
// c.envを通じてアクセス
app.get('/api/config', (c) => {
  const dbUrl = c.env.DATABASE_URL
  const apiKey = c.env.API_KEY
  // ...
})
```

### Next.jsでの使用

```typescript
// サーバーサイド
const sessionSecret = process.env.SESSION_SECRET

// クライアントサイド（NEXT_PUBLIC_プレフィックス必須）
const apiUrl = process.env.NEXT_PUBLIC_API_URL
```

## 本番環境への展開

### Cloudflare Workers

Cloudflareダッシュボードで環境変数を設定：
1. Workers & Pagesへ移動
2. 該当のWorkerを選択
3. Settings > Variables で環境変数を追加

### Vercel/その他のホスティング

デプロイメントプラットフォームの環境変数設定画面で設定してください。

## トラブルシューティング

### 環境変数が反映されない場合

1. Turborepoのキャッシュをクリア：
   ```bash
   pnpm turbo clean
   ```

2. 開発サーバーを再起動

3. `turbo.json`の`env`と`inputs`設定を確認

## セキュリティ注意事項

- `.dev.vars`と`.env.local`ファイルは絶対にGitにコミットしないでください
- 本番環境の秘密情報は環境変数管理システムで管理してください
- APIキーやトークンは定期的に更新してください
