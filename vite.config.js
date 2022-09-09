import { defineConfig, splitVendorChunkPlugin } from 'vite'
//import vue from '@vitejs/plugin-vue'
import amd from 'rollup-plugin-amd'
import builtins from 'rollup-plugin-node-builtins'
import globals from 'rollup-plugin-node-globals'
// https://vitejs.dev/config/
export default defineConfig({
  base: './',
  build: {
    target: 'esnext',
    polyfillModulePreload: false,
    cssCodeSplit: false,
    minify: false
  },
  plugins: [
    { ...builtins(), enforce: 'pre' },
    amd({
      include: 'node_modules/lzma-purejs/**'
    }),
    globals(),
    splitVendorChunkPlugin()
  ]
})
