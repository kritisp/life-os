'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { sanitizeErrorMessage } from '@/lib/errors'
import { ProfileRow, CharacterRow } from '@/types'
import {
  hashPassword,
  verifyPassword,
  setCustomSessionCookie,
  getCustomSessionUser,
  clearCustomSessionCookie,
} from '@/lib/auth/custom-auth'

export async function getCurrentUser() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    return { id: user.id, email: user.email || '' }
  }

  const customUser = await getCustomSessionUser()
  if (customUser) {
    return { id: customUser.id, email: customUser.email }
  }

  return null
}

export async function signUp(formData: FormData) {
  const email = ((formData.get('email') as string) || '').trim().toLowerCase()
  const password = (formData.get('password') as string) || ''
  const displayName = ((formData.get('displayName') as string) || email.split('@')[0]).trim()
  const username = ((formData.get('username') as string) || email.split('@')[0]).trim()

  if (!email || !password) {
    return { error: 'Email and password are required' }
  }

  if (password.length < 6) {
    return { error: 'Password must be at least 6 characters' }
  }

  const supabase = await createClient()

  // 1. Attempt standard Supabase Auth signup first
  const { data: suData, error: suError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        display_name: displayName,
        username: username,
      },
    },
  })

  if (!suError && suData.user) {
    const user = suData.user
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .single()

    if (!existingProfile) {
      await supabase.from('profiles').insert({
        id: user.id,
        email: email,
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
        strength: 10,
        intellect: 10,
        discipline: 10,
        vitality: 10,
        creativity: 10,
        current_streak: 1,
        longest_streak: 1,
        momentum: 100,
        archetype: 'The Balanced',
      } as CharacterRow)
    }

    return { success: true, user: suData.user }
  }

  // 2. Custom Auth Fallback (Password Hashing + Session Cookie) if Supabase Auth API is rate limited or restricted
  const { data: existingCustomProfile } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', email)
    .single()

  if (existingCustomProfile) {
    return { error: 'An account with this email already exists. Please log in.' }
  }

  const newUserId = crypto.randomUUID()
  const passwordHash = hashPassword(password)

  const { error: profileInsError } = await supabase.from('profiles').insert({
    id: newUserId,
    email: email,
    username: username,
    display_name: displayName,
    password_hash: passwordHash,
  } as unknown as ProfileRow)

  if (profileInsError) {
    return { error: sanitizeErrorMessage(profileInsError) }
  }

  await supabase.from('characters').insert({
    user_id: newUserId,
    name: displayName,
    level: 1,
    xp: 0,
    gold: 0,
    strength: 10,
    intellect: 10,
    discipline: 10,
    vitality: 10,
    creativity: 10,
    current_streak: 1,
    longest_streak: 1,
    momentum: 100,
    archetype: 'The Balanced',
  } as CharacterRow)

  await setCustomSessionCookie({
    id: newUserId,
    email: email,
    displayName: displayName,
  })

  return { success: true, user: { id: newUserId, email } }
}

export async function logIn(formData: FormData) {
  const email = ((formData.get('email') as string) || '').trim().toLowerCase()
  const password = (formData.get('password') as string) || ''

  if (!email || !password) {
    return { error: 'Email and password are required' }
  }

  const supabase = await createClient()

  // 1. Attempt standard Supabase Auth login
  const { data: suData, error: suError } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (!suError && suData.user) {
    return { success: true, user: suData.user }
  }

  // 2. Custom Auth Fallback: Verify hashed password in profiles table
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, email, display_name, password_hash')
    .eq('email', email)
    .single()

  if (profile && profile.password_hash) {
    const isValid = verifyPassword(password, profile.password_hash)
    if (isValid) {
      await setCustomSessionCookie({
        id: profile.id,
        email: profile.email || email,
        displayName: profile.display_name || email.split('@')[0],
      })

      // Ensure character row exists
      const { data: existingChar } = await supabase
        .from('characters')
        .select('id')
        .eq('user_id', profile.id)
        .single()

      if (!existingChar) {
        await supabase.from('characters').insert({
          user_id: profile.id,
          name: profile.display_name || 'Operator',
          level: 1,
          xp: 0,
          gold: 0,
          strength: 10,
          intellect: 10,
          discipline: 10,
          vitality: 10,
          creativity: 10,
          current_streak: 1,
          longest_streak: 1,
          momentum: 100,
          archetype: 'The Balanced',
        } as CharacterRow)
      }

      return { success: true, user: { id: profile.id, email: profile.email || email } }
    }
  }

  return { error: suError ? sanitizeErrorMessage(suError) : 'Invalid email or password' }
}

export async function logOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  await clearCustomSessionCookie()
  redirect('/auth')
}

export async function getCharacter() {
  const user = await getCurrentUser()
  if (!user) return null

  const supabase = await createClient()
  const { data: character } = await supabase
    .from('characters')
    .select('*')
    .eq('user_id', user.id)
    .single()

  return (character as CharacterRow | null)
}

export async function demoLogin() {
  const demoEmail = 'operator_demo@lifeos.dev'
  const demoPassword = 'DemoPassword123!'

  const formData = new FormData()
  formData.set('email', demoEmail)
  formData.set('password', demoPassword)
  formData.set('displayName', 'Demo Operator')
  formData.set('username', 'demo_operator')

  const loginRes = await logIn(formData)
  if (loginRes.success) return loginRes

  return await signUp(formData)
}
