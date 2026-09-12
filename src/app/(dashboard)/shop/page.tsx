'use client'

import React, { useEffect, useState } from 'react'
import { Package, Gem, Check, ShoppingBag, Crown } from 'lucide-react'
import { getShopItems, getUserInventory, purchaseItem } from '@/features/shop/actions'
import { ItemRow } from '@/types'

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
  const [activeTab, setActiveTab] = useState<'shop' | 'inventory'>('shop')
  const [equipped, setEquipped] = useState<string>('')
  const [purchasingId, setPurchasingId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const reloadData = () => {
    Promise.all([getShopItems(), getUserInventory()]).then(([shopList, userInv]) => {
      setItems(shopList)
      setInventory(userInv as unknown as InventoryItemWithDetails[])
      setLoading(false)
    })
  }

  useEffect(() => {
    let isMounted = true
    Promise.all([getShopItems(), getUserInventory()]).then(([shopList, userInv]) => {
      if (isMounted) {
        setItems(shopList)
        setInventory(userInv as unknown as InventoryItemWithDetails[])
        setLoading(false)
      }
    })
    return () => {
      isMounted = false
    }
  }, [])

  const handlePurchase = async (itemId: string) => {
    setPurchasingId(itemId)
    setErrorMsg(null)

    try {
      const res = await purchaseItem(itemId)
      if (res.success) {
        reloadData()
        setActiveTab('inventory')
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Purchase failed'
      setErrorMsg(msg)
    } finally {
      setPurchasingId(null)
    }
  }

  const ownedItemIds = new Set(inventory.map((inv) => inv.item_id))

  return (
    <>
      <div className="hero-heading">
        <div>
          <p className="eyebrow">PERSONAL LOADOUT · ARMORY SHOP</p>
          <h1>
            CARRY WHAT <em>MATTERS.</em>
          </h1>
        </div>
        <div className="flex gap-2">
          <button
            className={`quick-add ${activeTab === 'shop' ? 'bg-[#211b11]' : ''}`}
            onClick={() => setActiveTab('shop')}
          >
            <ShoppingBag size={15} /> ARMORY SHOP
          </button>
          <button
            className={`quick-add ${activeTab === 'inventory' ? 'bg-[#211b11]' : ''}`}
            onClick={() => setActiveTab('inventory')}
          >
            <Package size={15} /> INVENTORY ({inventory.length})
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="mb-6 p-3 bg-red-950/60 border border-red-800/60 text-red-300 text-xs font-mono rounded">
          {errorMsg}
        </div>
      )}

      {loading ? (
        <div className="p-12 text-center text-xs font-mono text-[#7b8586] border border-[#293033] bg-[#111416]">
          LOADING ARMORY...
        </div>
      ) : activeTab === 'shop' ? (
        <section className="space-y-4">
          <div className="section-heading">
            <div>
              <p className="eyebrow">CATALOGUE</p>
              <h2>AVAILABLE COSMETICS</h2>
            </div>
          </div>

          <div className="inventory-grid">
            {items.map((item) => {
              const isOwned = ownedItemIds.has(item.id)

              return (
                <article className="panel inventory-card" key={item.id}>
                  <div className="item-icon amber-item">
                    <Crown size={22} />
                  </div>

                  <div>
                    <h2>{item.name.toUpperCase()}</h2>
                    <p>{item.description}</p>
                    <span className="item-count mt-1 inline-block">
                      <Gem size={12} className="inline mr-1" />
                      {item.price} GOLD
                    </span>
                  </div>

                  <button
                    className={`equip-button ${isOwned ? 'opacity-60 cursor-not-allowed' : ''}`}
                    disabled={isOwned || purchasingId === item.id}
                    onClick={() => handlePurchase(item.id)}
                  >
                    {isOwned ? (
                      <>
                        <Check size={13} /> OWNED
                      </>
                    ) : purchasingId === item.id ? (
                      'PURCHASING...'
                    ) : (
                      'PURCHASE'
                    )}
                  </button>
                </article>
              )
            })}
          </div>
        </section>
      ) : (
        <section className="inventory-layout">
          <div className="inventory-grid">
            {inventory.length === 0 ? (
              <div className="col-span-2 p-12 text-center border border-[#293033] bg-[#111416] font-mono text-xs text-[#7b8586]">
                YOUR INVENTORY IS EMPTY. PURCHASE ITEMS FROM THE ARMORY SHOP.
              </div>
            ) : (
              inventory.map((inv) => {
                const item = inv.items
                const isEquipped = equipped === item?.id

                return (
                  <article
                    className={`panel inventory-card ${isEquipped ? 'equipped' : ''}`}
                    key={inv.id}
                  >
                    <div className="item-icon amber-item">
                      <Package size={22} />
                    </div>

                    <div>
                      <h2>{item?.name.toUpperCase()}</h2>
                      <p>{item?.description}</p>
                    </div>

                    <button
                      className="equip-button"
                      onClick={() => setEquipped(isEquipped ? '' : item?.id || '')}
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
            <p>
              {equipped
                ? 'This cosmetic item is equipped and active in your current build layout.'
                : 'Choose an item from your inventory to equip it in your build layout.'}
            </p>

            <div className="loadout-mark">
              <Package size={28} />
            </div>
          </aside>
        </section>
      )}
    </>
  )
}
