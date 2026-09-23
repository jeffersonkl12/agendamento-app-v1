import { fileURLToPath, URL } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'
import vueDevTools from 'vite-plugin-vue-devtools'

export default defineConfig({
  plugins: [vue(), tailwindcss(), vueDevTools()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@assets': fileURLToPath(new URL('./src/assets', import.meta.url)),
      '@assets/css': fileURLToPath(new URL('./src/assets/css', import.meta.url)),
      '@assets/icons': fileURLToPath(new URL('./src/assets/icons', import.meta.url)),
      '@assets/images': fileURLToPath(new URL('./src/assets/images', import.meta.url)),
      '@boot': fileURLToPath(new URL('./src/boot', import.meta.url)),
      '@components': fileURLToPath(new URL('./src/components', import.meta.url)),
      '@components/ui': fileURLToPath(new URL('./src/components/ui', import.meta.url)),
      '@composables': fileURLToPath(new URL('./src/composables', import.meta.url)),
      '@config': fileURLToPath(new URL('./src/config', import.meta.url)),
      '@constants': fileURLToPath(new URL('./src/constants', import.meta.url)),
      '@data': fileURLToPath(new URL('./src/data', import.meta.url)),
      '@layouts': fileURLToPath(new URL('./src/layouts', import.meta.url)),
      '@libs': fileURLToPath(new URL('./src/libs', import.meta.url)),
      '@pages': fileURLToPath(new URL('./src/pages', import.meta.url)),
      '@routers': fileURLToPath(new URL('./src/routers', import.meta.url)),
      '@views': fileURLToPath(new URL('./src/views', import.meta.url)),
      '@services': fileURLToPath(new URL('./src/services', import.meta.url)),
      '@stores': fileURLToPath(new URL('./src/stores', import.meta.url)),
      '@utils': fileURLToPath(new URL('./src/utils', import.meta.url)),
    },
  },
})
