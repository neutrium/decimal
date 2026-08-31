import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		fileParallelism: true,
		globals: true,
		include: ['src/**/*.spec.js']
	}
});
