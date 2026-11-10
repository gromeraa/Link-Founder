import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base './' permite publicar em qualquer lugar (Vercel, GitHub Pages, subpasta)
export default defineConfig({
  base: './',
  plugins: [react()],
});
