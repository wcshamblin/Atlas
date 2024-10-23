import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import viteTsconfigPaths from 'vite-tsconfig-paths'
import svgr from 'vite-plugin-svgr'
import eslint from 'vite-plugin-eslint'

export default defineConfig({
    base: '/',
    plugins: [react({ jsxRuntime: 'automatic' }), viteTsconfigPaths(), svgr(), eslint(),],
    server: {
        open: false,
        port: 4040,
    },
    css: {
        devSourcemap: true,
        preprocessorOptions: {
            scss: {
                api: "modern-compiler"
            }
        }
    },
    // esbuild: {
    //     jsxInject: `import React from 'react'`,
    // }
})