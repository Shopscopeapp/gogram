/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly NEXT_PUBLIC_SUPABASE_URL: string
  readonly NEXT_PUBLIC_SUPABASE_ANON_KEY: string
  readonly NEXT_PUBLIC_FROM_EMAIL: string
  readonly NEXT_PUBLIC_EMAIL_API_KEY: string
  readonly NEXT_PUBLIC_EMAIL_PROVIDER: string
  readonly NEXT_PUBLIC_APP_URL: string
  readonly NEXT_PUBLIC_MAILGUN_DOMAIN: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
} 