import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    // 端口号
    port: 3002,
    // 允许局域网访问 (必填)
    host: '0.0.0.0',
    
    // 【重点】这里是数组，注意语法格式
    // 如果这个配置导致报错，说明你的 Vite 版本太旧，不认识这个字段
    allowedHosts: true,

    // 代理后端接口
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:3001',
        changeOrigin: true, 
      }
    }
  }
})