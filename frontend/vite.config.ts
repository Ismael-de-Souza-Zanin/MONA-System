import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fakeApiPlugin } from './fake-api/plugin.ts'

export default defineConfig(({ mode }) => {
  const fakeApi = mode !== 'api'

  return {
    // Desktop Electron (file://) precisa de assets relativos
    base: process.env.VITE_DESKTOP === '1' ? './' : '/',
    define: {
      'import.meta.env.VITE_FAKE_API': JSON.stringify(fakeApi ? '1' : '0'),
    },
    plugins: [react(), tailwindcss(), ...(fakeApi ? [fakeApiPlugin()] : [])],
    server: fakeApi
      ? undefined
      : {
          proxy: {
            '/api': {
              target: 'http://localhost:5080',
              changeOrigin: true,
            },
          },
        },
  }
})
