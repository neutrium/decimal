/// <reference types="vitest/config" />
import { defineConfig } from 'vite';

export default defineConfig({
	test: {
		fileParallelism: true,
		globals: true,
		include: ['src/**/*.spec.js']
	}
});
