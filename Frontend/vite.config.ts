import { defineConfig } from 'vite'
import type { UserConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  let build: UserConfig['build']
  let esbuild: UserConfig['esbuild']
  let define: UserConfig['define']

  if (mode === 'development') {
    build = {
      minify: false,
      rollupOptions: {
        output: {
          manualChunks: undefined,
        },
      },
    }

    esbuild = {}

    define = {
      'process.env.NODE_ENV': '"development"',
      '__DEV__': 'true',
    }
  }

  return {
    plugins: [react()],
    build,
    esbuild,
    define,
    resolve: {
      alias: {
        '@': '/src',
      },
    },
    optimizeDeps: {
      exclude: ['lucide-react'],
    },
  }
})
