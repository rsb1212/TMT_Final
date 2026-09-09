// import { defineConfig } from 'vite';
// import react from '@vitejs/plugin-react';

// export default defineConfig({
//   plugins: [react()],
//   build: {
//     outDir: 'dist',
//     assetsDir: 'assets',
//   },
//   server: {
//     port: 3000,
//     proxy: {
//       '/api': {
//         target: 'http://10.3.41.102:8080',
//         // target: 'http://127.0.0.1:8080',
//         changeOrigin: true,
//       },
//     },
//   },
// });
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],

  build: {
    outDir: 'dist',
    assetsDir: 'assets',

    // Increase warning limit
    chunkSizeWarningLimit: 1500,

    // Split dependencies into separate chunks
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom'],
        },
      },
    },
  },

  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://10.3.41.102:8080',
        // target: 'http://127.0.0.1:8080',
        changeOrigin: true,
      },
    },
  },
});


