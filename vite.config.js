import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    target: 'es2020',
    cssMinify: true,
    minify: 'esbuild',
    sourcemap: false,
    assetsInlineLimit: 4096,
  },
  server: {
    port: 3000,
    host: true,
  },
});

