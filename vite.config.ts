import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, process.cwd(), '')
  
  // Debug: Log what environment variables are loaded
  console.log('🔧 Vite Environment Variables:', {
    mode,
    emailProvider: env.NEXT_PUBLIC_EMAIL_PROVIDER,
    hasEmailApiKey: !!env.NEXT_PUBLIC_EMAIL_API_KEY,
    emailApiKeyLength: env.NEXT_PUBLIC_EMAIL_API_KEY ? env.NEXT_PUBLIC_EMAIL_API_KEY.length : 0,
    fromEmail: env.NEXT_PUBLIC_FROM_EMAIL,
    appUrl: env.NEXT_PUBLIC_APP_URL
  })
  
  return {
    plugins: [react()],
    server: {
      port: 3000,
      open: true
    },
    resolve: {
      alias: {
        '@': '/src'
      }
    },
    define: {
      // Expose env variables to the client
      'import.meta.env.NEXT_PUBLIC_EMAIL_PROVIDER': JSON.stringify(env.NEXT_PUBLIC_EMAIL_PROVIDER),
      'import.meta.env.NEXT_PUBLIC_EMAIL_API_KEY': JSON.stringify(env.NEXT_PUBLIC_EMAIL_API_KEY),
      'import.meta.env.NEXT_PUBLIC_FROM_EMAIL': JSON.stringify(env.NEXT_PUBLIC_FROM_EMAIL),
      'import.meta.env.NEXT_PUBLIC_APP_URL': JSON.stringify(env.NEXT_PUBLIC_APP_URL),
      'import.meta.env.NEXT_PUBLIC_SUPABASE_URL': JSON.stringify(env.NEXT_PUBLIC_SUPABASE_URL),
      'import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY': JSON.stringify(env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
      'import.meta.env.NEXT_PUBLIC_APP_NAME': JSON.stringify(env.NEXT_PUBLIC_APP_NAME)
    }
  }
}) 