import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// GitHub Pages serves the site from /<repo-name>/, so every asset URL
// must be prefixed with the repository name (case-sensitive).
export default defineConfig({
  plugins: [react()],
  base: '/Dobro_Active_Interrupts/',
});
