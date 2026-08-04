import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

// Node environment — these are server route + lib unit tests, no DOM needed.
// The "@/..." alias mirrors tsconfig.json paths so imports resolve identically.
export default defineConfig({
  test: {
    environment: "node",
    include: ["**/*.test.ts"],
    exclude: ["node_modules/**", ".next/**", "lib/generated/**"],
    setupFiles: ["./vitest.setup.ts"],
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./", import.meta.url)),
    },
  },
});
