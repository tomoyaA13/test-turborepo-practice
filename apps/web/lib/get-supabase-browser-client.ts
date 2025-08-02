import { createBrowserClient } from "@supabase/ssr";
import { DatabaseType } from "@workspace/supabase-db-type/database-type";

/**
 * このファイルはフロントエンド専用のSupabaseクライアントを提供します。
 * createBrowserClientはシングルトンパターンを使用しており、
 * クライアントの再作成を防ぎます。
 *
 * 【使用場面】
 * 1. フロントエンドのコンポーネント内でのデータ取得
 * 2. クライアントサイドでのユーザー認証
 * 3. リアルタイムサブスクリプション
 * 4. クライアントサイドでのデータ操作
 *
 * 【使用例】
 * - ページコンポーネント内
 * - カスタムフック
 * - イベントハンドラー
 * - useEffect内
 *
 * 【使用しない場面】
 * - サーバーサイドコンポーネント内
 * - API Routes
 * - ミドルウェア
 * - サーバーアクション
 */

export const getSupabaseBrowserClient = () =>
  createBrowserClient<DatabaseType>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
