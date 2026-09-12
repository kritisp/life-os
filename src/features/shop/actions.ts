'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/features/auth/actions'
import { ItemPurchaseResult, ItemRow, InventoryRow } from '@/types'
import {
  UnauthorizedError,
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
  if (!itemId || typeof itemId !== 'string') {
    throw new ValidationError('Valid Item ID is required')
  }

  const user = await getCurrentUser()
  if (!user) {
    throw new UnauthorizedError()
  }

  const supabase = await createClient()

  // Execute atomic PostgreSQL RPC procedure with verified session identity
  const { data: rpcResult, error: rpcError } = await supabase.rpc(
    'purchase_item_rpc' as unknown as 'purchase_item_rpc',
    { p_item_id: itemId, p_user_id: user.id } as unknown as { p_item_id: string; p_user_id: string }
  )

  if (rpcError || !rpcResult) {
    const safeMsg = rpcError ? sanitizeErrorMessage(rpcError) : 'Failed to complete item purchase'
    throw new Error(safeMsg)
  }

  const resultData = rpcResult as { success: boolean; remainingGold: number; inventoryId: string }

  // Fetch created inventory row with item details
  const { data: invRow } = await supabase
    .from('inventory')
    .select('*, items(*)')
    .eq('id', resultData.inventoryId)
    .single()

  return {
    success: true,
    remainingGold: resultData.remainingGold,
    inventoryItem: (invRow || { id: resultData.inventoryId, item_id: itemId, user_id: user.id, is_equipped: false, purchased_at: new Date().toISOString() }) as unknown as InventoryRow,
  }
}
