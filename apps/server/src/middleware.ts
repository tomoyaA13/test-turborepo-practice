import { createServerClient, parseCookieHeader } from "@supabase/ssr";
import { SupabaseClient } from "@supabase/supabase-js";
import type { Context, MiddlewareHandler } from "hono";
import { env } from "hono/adapter";
import { setCookie } from "hono/cookie";
import type { CookieOptions as HonoCookieOptions } from "hono/utils/cookie";

// Honoの標準CookieOptionsを拡張した型
type ExtendedCookieOptions = HonoCookieOptions & {
  partitioned?: boolean;
  priority?: "Low" | "Medium" | "High" | "low" | "medium" | "high";
  prefix?: "host" | "secure";
};

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

// sameSiteの値を変換するヘルパー関数
function convertSameSite(
  sameSite: string | boolean | undefined,
): HonoCookieOptions["sameSite"] {
  if (!sameSite) return undefined;

  // trueの場合は"Strict"として扱う
  if (sameSite === true) {
    return "Strict";
  }

  // 文字列の場合は大文字小文字を調整
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

// priorityの値を変換するヘルパー関数（Honoが大文字を期待する場合）
function convertPriority(
  priority?: string
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
      // 大文字小文字の両方に対応
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
                partitioned: options.partitioned,
                priority: convertPriority(options.priority),
                // prefixはSerializeOptionsに存在しないので、明示的にチェック
                prefix: (options as any).prefix as "host" | "secure" | undefined,
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
