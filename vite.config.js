import { defineConfig } from 'vite';

export default defineConfig({
  // GitHub Pages serves this build at https://djrex500.github.io/bshot-royale/
  base: process.env.NODE_ENV === 'production' ? '/bshot-royale/' : '/',
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
});
