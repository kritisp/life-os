'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/features/auth/actions'
import { ItemPurchaseResult, AchievementRow, ItemRow, CharacterRow, InventoryRow } from '@/types'
import {
  UnauthorizedError,
  NotFoundError,
  ValidationError,
  sanitizeErrorMessage,
} from '@/lib/errors'

export async function getShopItems() {
  const supabase = await createClient()
  const { data: items, error } = await supabase
    .from('items')
    .select('*')
    .order('price', { ascending: true })

  if (error) {
    throw new Error(sanitizeErrorMessage(error))
  }
  return (items as unknown as ItemRow[]) || []
}

export async function getUserInventory() {
  const supabase = await createClient()
  const user = await getCurrentUser()

  if (!user) return []

  const { data: inventory } = await supabase
    .from('inventory')
    .select('*, items(*)')
    .eq('user_id', user.id)

  return inventory || []
}

export async function purchaseItem(itemId: string): Promise<ItemPurchaseResult> {
  const supabase = await createClient()
  const user = await getCurrentUser()

  if (!user) {
    throw new UnauthorizedError()
  }

  // 1. Attempt atomic RPC call first
  const { data: rpcResult, error: rpcError } = await supabase.rpc(
    'purchase_item_rpc' as unknown as 'purchase_item_rpc',
    { p_item_id: itemId } as unknown as { p_item_id: string }
  )

  if (!rpcError && rpcResult) {
    return rpcResult as unknown as ItemPurchaseResult
  }

  // 2. Server-side fallback execution
  // Fetch item details authoritatively from DB
  const { data: rawItem, error: itemError } = await supabase
    .from('items')
    .select('*')
    .eq('id', itemId)
    .single()

  if (itemError || !rawItem) {
    throw new NotFoundError('Item not found in armory catalog')
  }

  const item = rawItem as unknown as ItemRow

  // Check if item is already owned
  const { data: existingOwnership } = await supabase
    .from('inventory')
    .select('id')
    .eq('user_id', user.id)
    .eq('item_id', itemId)
    .single()

  if (existingOwnership) {
    throw new ValidationError('You already own this item')
  }

  // Fetch character gold balance
  const { data: rawCharacter, error: charError } = await supabase
    .from('characters')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (charError || !rawCharacter) {
    throw new NotFoundError('Character profile not found')
  }

  const character = rawCharacter as unknown as CharacterRow

  if (character.gold < item.price) {
    throw new ValidationError(`Insufficient Gold. Required: ${item.price}, Current: ${character.gold}`)
  }

  // Deduct Gold balance
  const remainingGold = character.gold - item.price
  await supabase
    .from('characters')
    .update({ gold: remainingGold, updated_at: new Date().toISOString() } as unknown as CharacterRow)
    .eq('user_id', user.id)

  // Insert inventory record
  const { data: inventoryItem, error: invError } = await supabase
    .from('inventory')
    .insert({
      user_id: user.id,
      item_id: itemId,
      is_equipped: false,
    } as unknown as InventoryRow)
    .select()
    .single()

  if (invError || !inventoryItem) {
    // Rollback gold adjustment if inventory insertion fails
    await supabase.from('characters').update({ gold: character.gold } as unknown as CharacterRow).eq('user_id', user.id)
    throw new Error('Failed to record item purchase')
  }

  // Check for FIRST_PURCHASE achievement
  let unlockedAchievement: AchievementRow | undefined = undefined
  const { data: rawFirstPurchaseAch } = await supabase
    .from('achievements')
    .select('*')
    .eq('code', 'FIRST_PURCHASE')
    .single()

  if (rawFirstPurchaseAch) {
    const firstPurchaseAch = rawFirstPurchaseAch as unknown as AchievementRow
    const { data: existingUnlock } = await supabase
      .from('user_achievements')
      .select('id')
      .eq('user_id', user.id)
      .eq('achievement_id', firstPurchaseAch.id)
      .single()

    if (!existingUnlock) {
      await supabase.from('user_achievements').insert({
        user_id: user.id,
        achievement_id: firstPurchaseAch.id,
      })
      unlockedAchievement = firstPurchaseAch
    }
  }

  return {
    success: true,
    remainingGold,
    inventoryItem: inventoryItem as unknown as InventoryRow,
    unlockedAchievement,
  }
}
