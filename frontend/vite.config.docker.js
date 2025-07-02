import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react({
      // Automatisches React-Import deaktivieren
      jsxImportSource: 'react'
    }),
    tailwindcss()
  ],
  base: '/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false
  },
  define: {
    'process.env': {},
    'global': 'globalThis',
  },
  // Diese Zeile entfernen oder auskommentieren:
  // esbuild: {
  //   jsxInject: `import React from 'react'`
  // }
})