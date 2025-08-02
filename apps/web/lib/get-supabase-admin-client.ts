import { createClient } from "@supabase/supabase-js";
import { DatabaseType } from "@workspace/supabase-db-type/database-type";

/**
 * このファイルは管理者権限を持つSupabaseクライアントを提供します。
 *
 * 【重要な注意点】
 * 1. このクライアントは管理者レベルの完全なデータベースアクセス権限を持ちます
 * 2. バックエンドのAPI関数内でのみ使用してください
 * 3. フロントエンド側で絶対に使用しないでください
 * 4. ユーザーセッション管理には使用しないでください
 *
 * 【使用例】
 * - データベースのメンテナンス操作
 * - バッチ処理による一括データ更新
 * - ユーザー管理機能（ただしセッション管理は除く）
 * - システム全体の統計情報の収集
 *
 * 【使用禁止の例】
 * - フロントエンドでのデータ取得
 * - ユーザー認証やセッション管理
 * - 特定のユーザーコンテキストが必要な操作
 */

export const getSupabaseAdminClient = () => {
  return createClient<DatabaseType>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
};
