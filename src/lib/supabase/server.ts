import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { Database } from '@/types/database'

/**
 * Creates an authoritative server-side Supabase client.
 * Strictly requires SUPABASE_SECRET_KEY for privileged server actions (fails closed).
 */
export async function createClient() {
  const cookieStore = await cookies()

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY

  if (!supabaseUrl) {
    throw new Error('FATAL CONFIGURATION ERROR: NEXT_PUBLIC_SUPABASE_URL is missing.')
  }

  if (!supabaseSecretKey) {
    throw new Error('FATAL CONFIGURATION ERROR: SUPABASE_SECRET_KEY is missing. Server operations fail closed.')
  }

  return createServerClient<Database>(supabaseUrl, supabaseSecretKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        } catch {
          // Server component context cookie sync
        }
      },
    },
  })
}
