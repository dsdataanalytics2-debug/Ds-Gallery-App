import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "mobile_app/**",
    "debug*.js",
    "debug*.ts",
    "lint-errors.txt",
    "verify-ownership.js",
    "verify-ownership.ts",
    "check-*.ts",
    "test-*.ts",
    "list-db-users.ts",
  ]),
]);

export default eslintConfig;
