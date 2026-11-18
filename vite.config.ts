import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// GitHub Pages 프로젝트 사이트 주소: https://swimming123.github.io/yoonsooyoung/
// 커스텀 도메인을 연결하면 BASE_PATH=/ 로 빌드하세요.
const base = process.env.BASE_PATH ?? '/yoonsooyoung/'

export default defineConfig({
  base,
  plugins: [vue()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
})
