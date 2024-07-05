import { defineConfig } from 'vite'
import amd from 'rollup-plugin-amd'
import nodePolyfills from 'rollup-plugin-node-polyfills'

const externalAssets = (() => {
  const reg = /\/(ionicons)\.[\da-f]{8}\.((?!woff2)\S+)$/
  return {
    renderBuiltUrl(fileName, { type, hostId, hostType }) {
      if (hostType === 'css') {
        const m = fileName.match(reg)
        if (m != null) { return `data:text/plain,${m[1]}.${m[2]}` }
      }
      return { relative: true }
    },
    plugin: {
      name: 'external-assets',
      generateBundle(options, bundle) {
        for (const fileName of Object.keys(bundle)) {
          const m = fileName.match(reg)
          if (m != null) { delete bundle[fileName] }
        }
      }
    }
  }
})()

export default defineConfig({
  base: './',
  build: {
    target: 'esnext',
    modulePreload: { polyfill: false },
    cssCodeSplit: false,
    minify: false
  },
  experimental: { renderBuiltUrl: externalAssets.renderBuiltUrl },
  plugins: [
    externalAssets.plugin,
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
    })()
  ]
})
