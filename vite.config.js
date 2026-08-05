import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load every env var (no prefix filter) so we can bridge non-VITE_ names
  // (e.g. the NEXT_PUBLIC_/SUPABASE_ vars provided by the Supabase integration)
  // into the client bundle under the VITE_ names the app expects.
  const env = { ...process.env, ...loadEnv(mode, process.cwd(), '') };

  const supabaseUrl =
    env.VITE_SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL || env.SUPABASE_URL || '';
  const supabaseAnonKey =
    env.VITE_SUPABASE_ANON_KEY ||
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    env.SUPABASE_ANON_KEY ||
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    env.SUPABASE_PUBLISHABLE_KEY ||
    '';

  return {
    define: {
      'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(supabaseUrl),
      'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(supabaseAnonKey),
    },
    plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      // Pre-cache the schemes.json so it is available offline immediately after first visit
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        additionalManifestEntries: [
          { url: '/schemes.json', revision: null }
        ],
        runtimeCaching: [
          {
            // App shell navigation — serve from cache, fall back to network
            urlPattern: ({ request }) => request.mode === 'navigate',
            handler: 'NetworkFirst',
            options: {
              cacheName: 'app-shell',
              networkTimeoutSeconds: 5,
              cacheableResponse: { statuses: [0, 200] }
            }
          },
          {
            // Static JS/CSS assets — cache-first for speed
            urlPattern: /\.(?:js|css|woff2?)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'static-assets',
              expiration: { maxAgeSeconds: 7 * 24 * 60 * 60 } // 7 days
            }
          },
          {
            // Schemes data — stale-while-revalidate so it loads fast and updates in background
            urlPattern: /\/schemes\.json$/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'schemes-data',
              expiration: { maxAgeSeconds: 24 * 60 * 60 } // 1 day
            }
          }
        ]
      },
      manifest: {
        name: 'ArogyaMitra',
        short_name: 'ArogyaMitra',
        description: 'AI-powered rural health assistant',
        theme_color: '#f0fdf4',
        background_color: '#ffffff',
        display: 'standalone',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
      })
    ]
  };
});
