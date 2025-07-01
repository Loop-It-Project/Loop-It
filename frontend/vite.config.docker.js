import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import tailwindcss from '@tailwindcss/vite'

// Einfache Lösung: React global machen
export default defineConfig({
  plugins: [
    react({
      // React in allen JSX-Dateien automatisch verfügbar machen
      jsxImportSource: 'react'
    }),
    tailwindcss()
  ],
  define: {
    'process.env': {},
    // React explizit global definieren
    'global': 'globalThis',
    'React': 'React'
  },
  // React automatisch in jede Datei einfügen
  esbuild: {
    jsxInject: `import React from 'react'`
  }
})