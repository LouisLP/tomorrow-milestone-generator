// PROTOTYPE (#6): throwaway Vite entry for the review UX variants. Not the real app config.
import { fileURLToPath } from 'node:url'
import vue from '@vitejs/plugin-vue'
import Icons from 'unplugin-icons/vite'
import { defineConfig } from 'vite'

export default defineConfig({
  root: fileURLToPath(new URL('.', import.meta.url)),
  plugins: [vue(), Icons({ compiler: 'vue3' })],
})
