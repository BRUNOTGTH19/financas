import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ command, isPreview }) => ({
  plugins: [react()],
  base: process.env.VITE_BASE ?? (command === 'build' || isPreview ? '/financas-semanais/' : '/'),
}));
