import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { NodeGlobalsPolyfillPlugin } from '@esbuild-plugins/node-globals-polyfill';

// https://vitejs.dev/config/
// export default defineConfig({
//   plugins: [
//     react(),
//     NodeGlobalsPolyfillPlugin({
//       buffer: true
//     })
//   ]
// });
export default defineConfig({
  define: {
    global: 'globalThis',
    'process.env': {}
  },
  // Enable esbuild polyfill plugins
  plugins: [
    react(),
    NodeGlobalsPolyfillPlugin({
      buffer: true
    })
  ]
});
