import process from 'node:process'
import { fileURLToPath, URL } from 'node:url'
import vue from '@vitejs/plugin-vue'
import Icons from 'unplugin-icons/vite'
import { defineConfig, loadEnv } from 'vite'
import vueDevTools from 'vite-plugin-vue-devtools'

export default defineConfig(({ mode }) => {
  const { PORT = '3000' } = loadEnv(mode, process.cwd(), '')

  return {
    root: fileURLToPath(new URL('./src/client', import.meta.url)),
    envDir: fileURLToPath(new URL('.', import.meta.url)),
    build: {
      outDir: fileURLToPath(new URL('./dist', import.meta.url)),
      emptyOutDir: true,
    },
    plugins: [
      vue(),
      vueDevTools(),
      // Iconify icons compiled in at build time: import from ~icons/lucide/<name>
      Icons({ compiler: 'vue3' }),
    ],
    resolve: {
      alias: {
        '@shared': fileURLToPath(new URL('./src/shared', import.meta.url)),
      },
    },
    server: {
      proxy: {
        '/api': `http://localhost:${PORT}`,
      },
    },
  }
})
