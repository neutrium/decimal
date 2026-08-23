import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		fileParallelism: false,
		globals: true,
		include: ['src/decimal/**/*.spec.js']
	}
});
