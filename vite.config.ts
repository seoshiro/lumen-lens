import { defineConfig } from 'vite';
export default defineConfig({
  base: './',
  optimizeDeps: { noDiscovery: true, include: [] },
  server: { host:'127.0.0.1',port:5413,strictPort:true },
  build: { target:'es2022',chunkSizeWarningLimit:650,rollupOptions:{output:{manualChunks:{three:['three']}}} },
});
