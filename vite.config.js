// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // Set a higher warning limit if needed, but prioritize actual code splitting
    // This value is in KiB. 1000 KiB = 1 MB.
    chunkSizeWarningLimit: 1000, // Adjust as per your performance budget

    rollupOptions: {
      output: {
        // manualChunks allows for explicit chunking of modules
        manualChunks(id) {
          // Group common third-party dependencies into a 'vendor' chunk
          if (id.includes('node_modules')) {
            // Group React and ReactDOM into a specific chunk
            if (id.includes('react') || id.includes('react-dom')) {
              return 'vendor-react';
            }
            // Group Firebase related modules
            if (id.includes('firebase')) {
              return 'vendor-firebase';
            }
            // Group jsPDF libraries
            if (id.includes('jspdf')) {
              return 'vendor-jspdf';
            }
            // Group react-hot-toast separately if it's significant
            if (id.includes('react-hot-toast')) {
              return 'vendor-toast';
            }
            // Default vendor chunk for other node_modules
            return 'vendor';
          }
          // Optionally, group application-specific components into logical chunks
          // For example, if you had a 'forms' directory with many form components:
          // if (id.includes('/src/components/forms/')) {
          //   return 'app-forms';
          // }
        },
      },
    },
  },
});
