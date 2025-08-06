import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";
import { DatabaseType } from "@workspace/supabase-db-type/database-type";

/**
 * このファイルはmiddleware.js専用のSupabaseクライアントを提供します。
 * NextRequestとNextResponseを使用してクッキーを管理します。
 *
 * 【主な使用場面】
 * 1. middleware.js内でのリクエスト/レスポンスの処理
 *    - ユーザー認証の確認
 *    - リクエストの検証
 *    - リダイレクトの制御
 *
 * 【使用例】
 * ```typescript
 * // middleware.ts
 * export async function middleware(request: NextRequest) {
 *   const { supabase, response } = getSupabaseReqResClient({ request });
 *   const { data: { session } } = await supabase.auth.getSession();
 *
 *   if (!session) {
 *     return NextResponse.redirect(new URL('/login', request.url));
 *   }
 *
 *   return response.value;
 * }
 * ```
 *
 * 【使用しない場面】
 * - サーバーサイドコンポーネント内（代わりにgetSupabaseCookiesUtilClient()を使用）
 * - クライアントコンポーネント内（代わりにgetSupabaseBrowserClient()を使用）
 * - Route Handlers内（代わりにgetSupabaseCookiesUtilClient()を使用）
 * - Server Actions内（代わりにgetSupabaseCookiesUtilClient()を使用）
 */

export const getSupabaseReqResClient = ({
  request,
}: {
  request: NextRequest;
}) => {
  // オブジェクトのプロパティを変更すると、そのオブジェクトを参照している全てのコードからその変更が見えるので、
  // ここでオブジェクトを作成しています。
  // NextResponse.next({ request: request }) において { request: request }のようにオプションを渡すことで、
  // 変更したリクエストを次のステップに送ることができます。
  const response = { value: NextResponse.next({ request: request }) };

  const supabase = createServerClient<DatabaseType>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    // ブラウザ環境では、JavaScriptのdocument.cookieAPIを使ってクッキーにアクセスする方法は標準化されています
    // middleware において、cookies にアクセスする方法はフレームワークごとに独自のAPIや仕組みがあります
    // なので、createServerClient でどのように cookies にアクセスすればいいのかを指示する必要があります。
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },

        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });

          response.value = NextResponse.next({ request });

          cookiesToSet.forEach(({ name, value, options }) => {
            response.value.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  return { supabase, response };
};
