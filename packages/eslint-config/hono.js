import honoConfig from '@hono/eslint-config'
import { config as baseConfig } from './base.js'

/**
 * ESLint configuration for Hono projects.
 * Extends the base configuration with Hono-specific rules.
 *
 * @type {import("eslint").Linter.Config}
 */
export const config = [
  ...baseConfig,
  ...honoConfig,
  {
    // Hono固有の追加ルールがあればここに記述
    rules: {
      // 例: Cloudflare Workers固有の設定
      "no-restricted-globals": ["error", "process", "Buffer"],
    },
  },
]
