import { createServerClient, parseCookieHeader } from "@supabase/ssr";
import { SupabaseClient } from "@supabase/supabase-js";
import type { Context, MiddlewareHandler } from "hono";
import { env } from "hono/adapter";
import { setCookie } from "hono/cookie";
import type { CookieOptions as HonoCookieOptions } from "hono/utils/cookie";

/**
 * Honoの標準CookieOptionsを拡張した型定義
 *
 * なぜ必要か：
 * HonoのCookieOptionsには含まれていないが、モダンなブラウザや
 * Supabaseが対応している追加のクッキー属性を含める必要があるため。
 *
 * 追加されたプロパティ：
 *
 * 1. partitioned?: boolean
 *    - CHIPS (Cookies Having Independent Partitioned State) 仕様の一部
 *    - サードパーティクッキーのプライバシー保護機能
 *    - trueにすると、クッキーがトップレベルサイトごとに分離される
 *    - 例: site-a.comに埋め込まれたsite-b.comのクッキーと、
 *          site-c.comに埋め込まれたsite-b.comのクッキーが別々に管理される
 *
 * 2. priority?: "Low" | "Medium" | "High" | "low" | "medium" | "high"
 *    - Chrome独自の拡張機能（他のブラウザは無視）
 *    - ブラウザのクッキー容量制限に達した時の削除優先順位を制御
 *    - Low: 最初に削除される（分析用クッキーなど）
 *    - Medium: デフォルト
 *    - High: 最後まで保持される（認証クッキーなど）
 *
 * 3. prefix?: "host" | "secure"
 *    - クッキー名のプレフィックスによるセキュリティ強化
 *    - "host": __Host- プレフィックスを付与
 *      • Secure属性が必須
 *      • Path=/が必須
 *      • Domainを設定できない（現在のホストのみ）
 *    - "secure": __Secure- プレフィックスを付与
 *      • Secure属性が必須
 *      • HTTPS接続でのみ送信される
 *
 * これらの属性により、よりセキュアで柔軟なクッキー管理が可能になります。
 *
 * 使用例：
 * ```typescript
 * // 認証クッキー（高優先度、セキュアプレフィックス付き）
 * setCookie(c, "auth-token", token, {
 *   secure: true,
 *   httpOnly: true,
 *   sameSite: "Strict",
 *   priority: "High",      // 削除されにくい
 *   prefix: "secure"       // __Secure-auth-token という名前になる
 * });
 *
 * // 分析用クッキー（低優先度、パーティション化）
 * setCookie(c, "analytics", data, {
 *   sameSite: "Lax",
 *   priority: "Low",       // 容量制限時に最初に削除
 *   partitioned: true      // サイトごとに分離
 * });
 * ```
 */
type ExtendedCookieOptions = HonoCookieOptions & {
  partitioned?: boolean;
  priority?: "Low" | "Medium" | "High" | "low" | "medium" | "high";
  prefix?: "host" | "secure";
};

// hono パッケージに既に存在する interface ContextVariableMap に、
// 新しいプロパティ supabase を追加
declare module "hono" {
  interface ContextVariableMap {
    supabase: SupabaseClient;
  }
}

export const getSupabase = (c: Context) => {
  return c.get("supabase");
};

type SupabaseEnv = {
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
};

/**
 * sameSiteの値を変換するヘルパー関数
 *
 * なぜ必要か：
 * - Supabase (cookieパッケージ): sameSite?: boolean | "lax" | "strict" | "none"
 * - Hono: sameSite?: "Strict" | "Lax" | "None" | "strict" | "lax" | "none"
 *
 * 主な違い：
 * 1. Supabaseはboolean型を許可（true = "strict"、false = 属性なし）
 * 2. 文字列の大文字小文字が異なる可能性がある
 *
 * この関数により、Supabaseの値をHonoが期待する形式に安全に変換します。
 */
function convertSameSite(
  sameSite: string | boolean | undefined,
): HonoCookieOptions["sameSite"] {
  if (!sameSite) return undefined;

  // boolean型の処理：trueの場合は"Strict"として扱う（RFC 6265bis準拠）
  if (sameSite === true) {
    return "Strict";
  }

  // 文字列の場合は大文字小文字を正規化
  // Honoは両方受け入れるが、一貫性のため最初の文字を大文字にする
  if (typeof sameSite === "string") {
    const normalized = sameSite.toLowerCase();
    switch (normalized) {
      case "strict":
        return "Strict";
      case "lax":
        return "Lax";
      case "none":
        return "None";
      default:
        return undefined;
    }
  }

  return undefined;
}

/**
 * priorityの値を変換するヘルパー関数
 *
 * なぜ必要か：
 * - Supabase (cookieパッケージ): priority?: "low" | "medium" | "high" (小文字のみ)
 * - Hono: priority?: "Low" | "Medium" | "High" | "low" | "medium" | "high" (両方)
 *
 * Honoは大文字小文字の両方を受け入れますが、Supabaseからは小文字のみが来ます。
 * この関数で一貫性のため、最初の文字を大文字に変換します。
 *
 * Priority属性はChrome独自の拡張で、クッキーの優先度を制御します：
 * - Low: 容量制限時に最初に削除される
 * - Medium: デフォルト
 * - High: 最後まで保持される
 */
function convertPriority(
  priority?: string,
): "Low" | "Medium" | "High" | "low" | "medium" | "high" | undefined {
  if (!priority) return undefined;

  const normalized = priority.toLowerCase();
  switch (normalized) {
    case "low":
      return "Low";
    case "medium":
      return "Medium";
    case "high":
      return "High";
    default:
      // 予期しない値の場合も型アサーションで通す（将来の拡張性のため）
      return priority as "Low" | "Medium" | "High" | "low" | "medium" | "high";
  }
}

export const supabaseMiddleware = (): MiddlewareHandler => {
  return async (c, next) => {
    const supabaseEnv = env<SupabaseEnv>(c);
    const supabaseUrl = supabaseEnv.SUPABASE_URL;
    const supabaseAnonKey = supabaseEnv.SUPABASE_ANON_KEY;

    if (!supabaseUrl) {
      throw new Error("SUPABASE_URL missing!");
    }

    if (!supabaseAnonKey) {
      throw new Error("SUPABASE_ANON_KEY missing!");
    }

    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          const cookieHeader = c.req.header("Cookie") ?? "";
          const parsed = parseCookieHeader(cookieHeader);

          // parseCookieHeaderの戻り値を適切な型に変換
          // valueがundefinedの場合は空文字列として扱う
          return parsed.map(({ name, value }) => ({
            name,
            value: value ?? "",
          }));
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            try {
              // 開発環境でのデバッグログ
              if (process.env.NODE_ENV === "development") {
                console.log(`Setting cookie: ${name}`, {
                  value: value.substring(0, 10) + "...", // 値の一部のみ表示
                  options,
                });
              }

              if (!options) {
                setCookie(c, name, value);
                return;
              }

              // Hono用のCookieOptionsを構築
              const honoCookieOptions: HonoCookieOptions = {
                domain: options.domain,
                expires: options.expires,
                httpOnly: options.httpOnly,
                maxAge: options.maxAge,
                path: options.path,
                secure: options.secure,
                sameSite: convertSameSite(options.sameSite),
              };

              // HonoのCookieOptionsには存在しないがSupabaseにはある属性
              // 型を明確にして拡張
              const extendedOptions: ExtendedCookieOptions = {
                ...honoCookieOptions,
                // CHIPS仕様：クッキーをサイトごとに分離（プライバシー保護）
                partitioned: options.partitioned,
                // Chrome限定：クッキーの保持優先度（認証系はHigh推奨）
                priority: convertPriority(options.priority),
                // prefixはSerializeOptionsに存在しないので、明示的にチェック
                // セキュリティ強化：__Host-または__Secure-プレフィックスを付与
                prefix: (options as any).prefix as
                  | "host"
                  | "secure"
                  | undefined,
              };

              setCookie(c, name, value, extendedOptions as any);
            } catch (error) {
              console.error(`Failed to set cookie ${name}:`, error);
              // エラーをログに記録するが、処理は続行
              // 必要に応じて、ここでエラーを再スローすることも可能
              // throw error;
            }
          });
        },
      },
    });

    c.set("supabase", supabase);

    await next();
  };
};
