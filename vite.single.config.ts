import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Build used only to produce the single-file express-byte.html: every image
// is inlined (as a data URI) and the code is bundled into one chunk, so a
// script can then fold the JS and CSS into the HTML page itself.
export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    outDir: process.env.SINGLE_OUT ?? 'dist-single',
    emptyOutDir: true,
    assetsInlineLimit: () => true,
    cssCodeSplit: false,
    modulePreload: false,
    rollupOptions: { output: { inlineDynamicImports: true } },
  },
})
