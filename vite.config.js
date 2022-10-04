import { defineConfig, splitVendorChunkPlugin } from 'vite'
import amd from 'rollup-plugin-amd'
import nodePolyfills from 'rollup-plugin-node-polyfills'
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
    amd({
      include: 'node_modules/lzma-purejs/**'
    }),
    ...((opts = {}) => {
      const { resolveId: nodePolyfillsPluginResolveId, ...nodePolyfillsPlugin } = nodePolyfills(opts)
      return [
        {
          name: 'node-builtins-resolve-id',
          resolveId: nodePolyfillsPluginResolveId,
          enforce: 'pre'
        },
        {
          ...nodePolyfillsPlugin,
          enforce: 'post'
        }
      ]
    })(),
    splitVendorChunkPlugin()
  ]
})
