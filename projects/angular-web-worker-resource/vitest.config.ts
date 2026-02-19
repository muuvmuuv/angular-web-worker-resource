import { defineConfig } from "vitest/config"

export default defineConfig({
	test: {
		include: ["src/**/*.spec.ts", "worker/**/*.spec.ts"],
		environment: "node",
		typecheck: {
			tsconfig: "./tsconfig.spec.json",
		},
	},
})
