'use client'

import React, { useEffect, useState } from 'react'
import { Package, Gem, Check, ShoppingBag, Crown } from 'lucide-react'
import { getShopItems, getUserInventory, purchaseItem } from '@/features/shop/actions'
import { getCharacter } from '@/features/auth/actions'
import { ItemRow, CharacterRow } from '@/types'
import { StaggerContainer, StaggerItem, AnimatedNumber } from '@/components/ui/Motion'
import { useToast } from '@/components/ui/Toast'

interface InventoryItemWithDetails {
  id: string
  item_id: string
  is_equipped: boolean
  purchased_at: string
  items: ItemRow
}

export default function ShopPage() {
  const [items, setItems] = useState<ItemRow[]>([])
  const [inventory, setInventory] = useState<InventoryItemWithDetails[]>([])
  const [character, setCharacter] = useState<CharacterRow | null>(null)
  const [activeTab, setActiveTab] = useState<'shop' | 'inventory'>('shop')
  const [equipped, setEquipped] = useState<string>('')
  const [purchasingId, setPurchasingId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const { addToast } = useToast()

  const reloadData = () => {
    Promise.all([getShopItems(), getUserInventory(), getCharacter()]).then(
      ([shopList, userInv, charData]) => {
        setItems(shopList)
        setInventory(userInv as unknown as InventoryItemWithDetails[])
        setCharacter(charData)
        setLoading(false)
      }
    )
  }

  useEffect(() => {
    let isMounted = true
    Promise.all([getShopItems(), getUserInventory(), getCharacter()]).then(
      ([shopList, userInv, charData]) => {
        if (isMounted) {
          setItems(shopList)
          setInventory(userInv as unknown as InventoryItemWithDetails[])
          setCharacter(charData)
          setLoading(false)
        }
      }
    )
    return () => {
      isMounted = false
    }
  }, [])

  const handlePurchase = async (item: ItemRow) => {
    if (!character) return

    if (character.gold < item.price) {
      addToast({
        title: 'INSUFFICIENT GOLD',
        description: `Required: ${item.price} Gold. Current balance: ${character.gold} Gold. Complete quests to earn Gold!`,
        type: 'error',
      })
      return
    }

    setPurchasingId(item.id)

    try {
      const res = await purchaseItem(item.id)
      if (res.success) {
        addToast({
          title: 'PURCHASE COMPLETED',
          description: `Acquired ${item.name}! Added to your inventory.`,
          type: 'item_unlocked',
        })
        reloadData()
        setActiveTab('inventory')
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Purchase failed'
      addToast({
        title: 'PURCHASE REJECTED',
        description: msg,
        type: 'error',
      })
    } finally {
      setPurchasingId(null)
    }
  }

  const ownedItemIds = new Set(inventory.map((inv) => inv.item_id))

  return (
    <StaggerContainer className="space-y-6">
      {/* Hero Header */}
      <StaggerItem>
        <div className="hero-heading">
          <div>
            <p className="eyebrow">
              PERSONAL LOADOUT · ARMORY SHOP · BALANCE: {character ? `${character.gold} GOLD` : '...'}
            </p>
            <h1>
              CARRY WHAT <em>MATTERS.</em>
            </h1>
          </div>
          <div className="flex gap-2">
            <button
              className={`quick-add ${activeTab === 'shop' ? 'bg-[#211b11] border-[#d7a646]' : ''}`}
              onClick={() => setActiveTab('shop')}
            >
              <ShoppingBag size={15} /> ARMORY CATALOG ({items.length})
            </button>
            <button
              className={`quick-add ${activeTab === 'inventory' ? 'bg-[#211b11] border-[#d7a646]' : ''}`}
              onClick={() => setActiveTab('inventory')}
            >
              <Package size={15} /> INVENTORY ({inventory.length})
            </button>
          </div>
        </div>
      </StaggerItem>

      {loading ? (
        <div className="p-12 text-center text-xs font-mono text-[#7b8586] border border-[#293033] bg-[#111416]">
          INITIALIZING ARMORY TELEMETRY...
        </div>
      ) : activeTab === 'shop' ? (
        <section className="space-y-4">
          <StaggerItem>
            <div className="section-heading">
              <div>
                <p className="eyebrow">EQUIPMENT & VISUAL ENHANCEMENTS</p>
                <h2>AVAILABLE COSMETICS</h2>
              </div>
              {character && (
                <div className="flex items-center gap-1.5 font-mono text-xs text-amber-400">
                  <Gem size={14} />
                  <span>
                    AVAILABLE: <AnimatedNumber value={character.gold} /> GOLD
                  </span>
                </div>
              )}
            </div>
          </StaggerItem>

          <div className="inventory-grid">
            {items.map((item) => {
              const isOwned = ownedItemIds.has(item.id)
              const canAfford = character ? character.gold >= item.price : false

              return (
                <StaggerItem key={item.id}>
                  <article className={`panel inventory-card relative ${isOwned ? 'border-[#384346]' : ''}`}>
                    <div className="item-icon amber-item">
                      <Crown size={22} />
                    </div>

                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 bg-[#171b1d] border border-[#2e373a] text-[#7b8586]">
                          {item.category}
                        </span>
                      </div>
                      <h2 className="font-mono text-sm">{item.name.toUpperCase()}</h2>
                      <p className="text-xs text-[#7b8586] mt-1">{item.description}</p>
                      <span className="item-count mt-2 inline-flex items-center gap-1 text-amber-400 font-mono text-xs">
                        <Gem size={12} />
                        {item.price} GOLD
                      </span>
                    </div>

                    <button
                      className={`equip-button ${
                        isOwned
                          ? 'opacity-60 cursor-not-allowed bg-[#181d1e]'
                          : !canAfford
                          ? 'border-[#553b3b] text-[#c97575] hover:border-[#7a4848]'
                          : ''
                      }`}
                      disabled={isOwned || purchasingId === item.id}
                      onClick={() => handlePurchase(item)}
                    >
                      {isOwned ? (
                        <>
                          <Check size={13} /> OWNED
                        </>
                      ) : purchasingId === item.id ? (
                        'ACQUIRING...'
                      ) : !canAfford ? (
                        'NEED GOLD'
                      ) : (
                        'PURCHASE'
                      )}
                    </button>
                  </article>
                </StaggerItem>
              )
            })}
          </div>
        </section>
      ) : (
        <section className="inventory-layout">
          <div className="inventory-grid">
            {inventory.length === 0 ? (
              <div className="col-span-2 p-12 text-center border border-[#293033] bg-[#111416] font-mono text-xs text-[#7b8586] space-y-3">
                <Package size={28} className="mx-auto text-[#4d5758]" />
                <p>YOUR INVENTORY IS CURRENTLY EMPTY.</p>
                <p className="text-[11px] text-[#636e70]">
                  Complete quests to earn Gold, then acquire cosmetics from the Armory Catalog.
                </p>
                <button className="quick-add mx-auto" onClick={() => setActiveTab('shop')}>
                  <ShoppingBag size={14} /> BROWSE CATALOG
                </button>
              </div>
            ) : (
              inventory.map((inv) => {
                const item = inv.items
                const isEquipped = equipped === item?.id

                return (
                  <article
                    className={`panel inventory-card ${isEquipped ? 'equipped border-[#d7a646]' : ''}`}
                    key={inv.id}
                  >
                    <div className="item-icon amber-item">
                      <Package size={22} />
                    </div>

                    <div>
                      <h2 className="font-mono text-sm">{item?.name.toUpperCase()}</h2>
                      <p className="text-xs text-[#7b8586] mt-1">{item?.description}</p>
                    </div>

                    <button
                      className={`equip-button ${isEquipped ? 'bg-amber-950/40 text-amber-300' : ''}`}
                      onClick={() => {
                        const newEquipped = isEquipped ? '' : item?.id || ''
                        setEquipped(newEquipped)
                        addToast({
                          title: isEquipped ? 'COSMETIC UNEQUIPPED' : 'COSMETIC EQUIPPED',
                          description: isEquipped ? 'Item returned to reserve.' : `${item?.name} activated in loadout.`,
                          type: 'info',
                        })
                      }}
                    >
                      {isEquipped ? (
                        <>
                          <Check size={13} /> EQUIPPED
                        </>
                      ) : (
                        'EQUIP'
                      )}
                    </button>
                  </article>
                )
              })
            )}
          </div>

          <aside className="loadout panel">
            <p className="eyebrow">CURRENT LOADOUT</p>
            <h2>{equipped ? 'ACTIVE COSMETIC FRAME' : 'EMPTY SLOT'}</h2>
            <p className="text-xs text-[#8e9799] leading-relaxed mt-2">
              {equipped
                ? 'This cosmetic item is equipped and active in your current build layout.'
                : 'Choose an item from your inventory to equip it in your active build layout.'}
            </p>

            <div className="loadout-mark my-6">
              <Package size={28} className={equipped ? 'text-[#d7a646]' : 'text-[#4d5758]'} />
            </div>

            <div className="pt-4 border-t border-[#293033] font-mono text-xs text-[#7b8586]">
              {character && (
                <div className="flex justify-between">
                  <span>ARMORY BALANCE</span>
                  <b className="text-amber-400">{character.gold} GOLD</b>
                </div>
              )}
            </div>
          </aside>
        </section>
      )}
    </StaggerContainer>
  )
}
