'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { sanitizeErrorMessage } from '@/lib/errors'
import { ProfileRow, CharacterRow } from '@/types'

export async function signUp(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const displayName = (formData.get('displayName') as string) || email.split('@')[0]
  const username = (formData.get('username') as string) || email.split('@')[0]

  if (!email || !password) {
    return { error: 'Email and password are required' }
  }

  const supabase = await createClient()

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        display_name: displayName,
        username: username,
      },
    },
  })

  if (error) {
    return { error: sanitizeErrorMessage(error) }
  }

  const user = data.user
  if (user) {
    // Fallback profile and character creation in case database triggers are delayed
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .single()

    if (!existingProfile) {
      await supabase.from('profiles').insert({
        id: user.id,
        username: username,
        display_name: displayName,
      } as ProfileRow)
    }

    const { data: existingCharacter } = await supabase
      .from('characters')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (!existingCharacter) {
      await supabase.from('characters').insert({
        user_id: user.id,
        name: displayName,
        level: 1,
        xp: 0,
        gold: 0,
        strength: 0,
        intellect: 0,
        discipline: 0,
        vitality: 0,
        creativity: 0,
        current_streak: 0,
        longest_streak: 0,
        momentum: 0,
        archetype: 'The Balanced',
      } as CharacterRow)
    }
  }

  return { success: true, user: data.user }
}

export async function logIn(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !password) {
    return { error: 'Email and password are required' }
  }

  const supabase = await createClient()

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return { error: sanitizeErrorMessage(error) }
  }

  return { success: true, user: data.user }
}

export async function logOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/auth')
}

export async function getCurrentUser() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user
}

export async function getCharacter() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data: character } = await supabase
    .from('characters')
    .select('*')
    .eq('user_id', user.id)
    .single()

  return (character as CharacterRow | null)
}
