// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'

export default defineConfig({
  plugins: [react()],
  // diz ao Vite onde buscar os .env
  envDir: path.resolve(__dirname, '../env'),

  // (opcional) se você precisa importar arquivos fora de /src durante o dev
  server: {
    fs: {
      allow: [path.resolve(__dirname, '..')] // cuidado: só permita o necessário
    }
  },

  // (opcional) alias "@" → src
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
})
