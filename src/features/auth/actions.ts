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
  return await getCustomSessionUser()
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

  // Check if account with this email already exists
  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', email)
    .maybeSingle()

  if (existingProfile) {
    return { error: 'An account with this email address already exists. Please log in.' }
  }

  const userId = crypto.randomUUID()
  const passwordHash = hashPassword(password)

  // Insert user profile into database
  const { error: profileError } = await supabase.from('profiles').insert({
    id: userId,
    email: email,
    username: username,
    display_name: displayName,
    password_hash: passwordHash,
  } as unknown as ProfileRow)

  if (profileError) {
    return { error: sanitizeErrorMessage(profileError) }
  }

  // Insert initial character row into database
  await supabase.from('characters').insert({
    user_id: userId,
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

  // Establish HTTP-only session cookie
  await setCustomSessionCookie({
    id: userId,
    email: email,
    displayName: displayName,
  })

  return { success: true, user: { id: userId, email } }
}

export async function logIn(formData: FormData) {
  const email = ((formData.get('email') as string) || '').trim().toLowerCase()
  const password = (formData.get('password') as string) || ''

  if (!email || !password) {
    return { error: 'Email and password are required' }
  }

  const supabase = await createClient()

  // Query user profile from database
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('id, email, display_name, password_hash')
    .eq('email', email)
    .maybeSingle()

  if (error || !profile || !profile.password_hash) {
    return { error: 'Invalid email or password' }
  }

  // Verify PBKDF2 password hash
  const isValid = verifyPassword(password, profile.password_hash)
  if (!isValid) {
    return { error: 'Invalid email or password' }
  }

  // Establish HTTP-only session cookie
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
    .maybeSingle()

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

export async function logOut() {
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
    .maybeSingle()

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
