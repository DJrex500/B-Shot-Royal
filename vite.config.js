import { defineConfig } from 'vite';

export default defineConfig(({ command }) => ({
  // Live site is the user Pages repo: https://djrex500.github.io/bshot-royale/
  base: command === 'build' ? '/bshot-royale/' : '/',
  server: {
    port: 8080,
    strictPort: true,
    open: false,
  },
  build: {
    rollupOptions: {
      input: {
        main: 'index.html',
        skinLab: 'skin-lab.html',
      },
    },
  },
}));
