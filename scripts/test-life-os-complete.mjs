import pg from 'pg'
import crypto from 'crypto'
import fs from 'fs'

// Load environment variables from .env.local
let dbUrl = process.env.DATABASE_URL

if (fs.existsSync('.env.local')) {
  const content = fs.readFileSync('.env.local', 'utf8')
  for (const line of content.split('\n')) {
    const trimmed = line.trim()
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const idx = trimmed.indexOf('=')
      const k = trimmed.slice(0, idx).trim()
      const v = trimmed.slice(idx + 1).trim()
      if (k === 'DATABASE_URL') dbUrl = v
    }
  }
}

console.log('=================================================================')
console.log('LIFE//OS — COMPREHENSIVE SUITE: AUTH, RPCS, ENGINE & ISOLATION')
console.log('=================================================================')

const client = new pg.Client({
  connectionString: dbUrl,
  ssl: { rejectUnauthorized: false },
})

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex')
  const derivedKey = crypto.scryptSync(password, salt, 64)
  return `${salt}:${derivedKey.toString('hex')}`
}

function verifyPassword(password, combinedHash) {
  try {
    const [salt, storedHash] = combinedHash.split(':')
    if (!salt || !storedHash) return false
    const derivedKey = crypto.scryptSync(password, salt, 64)
    const storedBuffer = Buffer.from(storedHash, 'hex')
    if (storedBuffer.length !== derivedKey.length) return false
    return crypto.timingSafeEqual(storedBuffer, derivedKey)
  } catch {
    return false
  }
}

async function runTests() {
  // 1. Test scrypt Password Hashing
  console.log('\n[TEST 1] Testing scrypt Password Hashing & Timing-Safe Verification...')
  const pass = 'OperatorPassword!2026'
  const hash = hashPassword(pass)
  const isMatch = verifyPassword(pass, hash)
  const isWrong = verifyPassword('WrongPassword', hash)
  if (!isMatch || isWrong) {
    throw new Error('TEST 1 FAILED: Password verification mismatch.')
  }
  console.log('  -> PASS: scrypt hashing and timingSafeEqual verified.')

  await client.connect()
  console.log('  -> Connected to Postgres DB.')

  // 2. Create User A
  console.log('\n[TEST 2] Creating User A & Initializing Character Defaults...')
  const userAId = crypto.randomUUID()
  const userAEmail = `test_user_a_${Date.now()}@lifeos.dev`
  const userAPassHash = hashPassword('UserAPassword123!')

  await client.query(`
    INSERT INTO public.profiles (id, email, username, display_name, password_hash)
    VALUES ($1, $2, $3, $4, $5)
  `, [userAId, userAEmail, `usera_${Date.now()}`, 'Operator A', userAPassHash])

  await client.query(`
    INSERT INTO public.characters (
      user_id, name, level, xp, gold,
      strength, intellect, discipline, vitality, creativity,
      current_streak, longest_streak, momentum, archetype, last_active_date
    ) VALUES ($1, $2, 1, 0, 0, 10, 10, 10, 10, 10, 0, 0, 0, 'The Balanced', NULL)
  `, [userAId, 'Operator A'])

  const charARes = await client.query('SELECT * FROM public.characters WHERE user_id = $1', [userAId])
  const charA = charARes.rows[0]

  if (
    charA.level !== 1 ||
    charA.xp !== 0 ||
    charA.gold !== 0 ||
    charA.strength !== 10 ||
    charA.intellect !== 10 ||
    charA.current_streak !== 0 ||
    charA.momentum !== 0 ||
    charA.archetype !== 'The Balanced'
  ) {
    throw new Error('TEST 2 FAILED: Initial character defaults incorrect.')
  }
  console.log('  -> PASS: User A character initialized with exact Level 1 defaults.')

  // 3. Create Quests for User A & Execute Quest 1
  console.log('\n[TEST 3] Creating Quests for User A & Testing Atomic Completion RPC...')
  const quest1Id = crypto.randomUUID()
  await client.query(`
    INSERT INTO public.tasks (id, user_id, title, description, category, difficulty, attribute, base_xp, base_gold)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
  `, [quest1Id, userAId, 'Master Core Architecture', 'Implement security architecture', 'coding', 'hard', 'intellect', 200, 100])

  // Execute complete_quest_rpc
  const rpcRes1 = await client.query('SELECT public.complete_quest_rpc($1, $2) as result', [quest1Id, userAId])
  const result1 = rpcRes1.rows[0].result

  console.log('  -> Quest 1 RPC Result:', JSON.stringify(result1))

  if (
    !result1.success ||
    result1.xpGained !== 200 ||
    result1.goldGained !== 100 ||
    result1.attributeGained !== 4 ||
    result1.attributeName !== 'intellect' ||
    result1.currentStreak !== 1 ||
    result1.build.name !== 'The Balanced' // diff = 4 <= 5 -> Balanced
  ) {
    throw new Error('TEST 3 FAILED: RPC reward or baseline calculation unexpected.')
  }
  console.log('  -> PASS: Quest 1 completion succeeded (Rewards & First Blood achievement unlocked).')

  // Quest 2: Epic Intellect (+10 Intellect -> Intellect becomes 24, diff = 14 > 5 -> The Scholar)
  const quest2Id = crypto.randomUUID()
  await client.query(`
    INSERT INTO public.tasks (id, user_id, title, description, category, difficulty, attribute, base_xp, base_gold)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
  `, [quest2Id, userAId, 'Epic System Architecture', 'Deep technical mastery', 'coding', 'epic', 'intellect', 500, 250])

  const rpcRes2 = await client.query('SELECT public.complete_quest_rpc($1, $2) as result', [quest2Id, userAId])
  const result2 = rpcRes2.rows[0].result

  console.log('  -> Quest 2 RPC Result (Archetype Evolution):', JSON.stringify(result2.build))
  if (result2.build.name !== 'The Scholar' || !result2.didLevelUp) {
    throw new Error('TEST 3 FAILED: Archetype did not evolve to The Scholar or Level did not advance.')
  }
  console.log('  -> PASS: Archetype deterministic evolution to The Scholar & Level Up verified!')

  // 4. Test Duplicate Quest Completion (Must Fail)
  console.log('\n[TEST 4] Testing Duplicate Quest Completion Prevention...')
  let duplicatePrevented = false
  try {
    await client.query('SELECT public.complete_quest_rpc($1, $2) as result', [quest1Id, userAId])
  } catch (err) {
    duplicatePrevented = true
    console.log('  -> Caught expected error on duplicate execution:', err.message)
  }

  if (!duplicatePrevented) {
    throw new Error('TEST 4 FAILED: Duplicate quest completion was NOT prevented.')
  }
  console.log('  -> PASS: Duplicate quest completion safely rejected.')

  // 5. Test User B Isolation & Access Control
  console.log('\n[TEST 5] Testing Cross-User Isolation (User B cannot touch User A data)...')
  const userBId = crypto.randomUUID()
  const userBEmail = `test_user_b_${Date.now()}@lifeos.dev`
  const userBPassHash = hashPassword('UserBPassword123!')

  await client.query(`
    INSERT INTO public.profiles (id, email, username, display_name, password_hash)
    VALUES ($1, $2, $3, $4, $5)
  `, [userBId, userBEmail, `userb_${Date.now()}`, 'Operator B', userBPassHash])

  await client.query(`
    INSERT INTO public.characters (
      user_id, name, level, xp, gold,
      strength, intellect, discipline, vitality, creativity,
      current_streak, longest_streak, momentum, archetype, last_active_date
    ) VALUES ($1, $2, 1, 0, 0, 10, 10, 10, 10, 10, 0, 0, 0, 'The Balanced', NULL)
  `, [userBId, 'Operator B'])

  // User B tries to complete User A's new quest
  const quest3Id = crypto.randomUUID()
  await client.query(`
    INSERT INTO public.tasks (id, user_id, title, description, category, difficulty, attribute, base_xp, base_gold)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
  `, [quest3Id, userAId, 'User A Private Quest', 'Private task', 'routine', 'easy', 'discipline', 50, 20])

  let isolationPassed = false
  try {
    await client.query('SELECT public.complete_quest_rpc($1, $2) as result', [quest3Id, userBId])
  } catch (err) {
    isolationPassed = true
    console.log('  -> Caught expected isolation denial:', err.message)
  }

  if (!isolationPassed) {
    throw new Error('TEST 5 FAILED: User B was able to complete User A quest.')
  }
  console.log('  -> PASS: Cross-user completion strictly rejected.')

  // 6. Test Shop Purchase & Insufficient Gold Guard
  console.log('\n[TEST 6] Testing Armory Purchase & Economy Security...')
  const itemRes = await client.query('SELECT * FROM public.items WHERE price <= 100 LIMIT 1')
  if (itemRes.rows.length === 0) {
    throw new Error('No items in shop catalog')
  }
  const affordableItem = itemRes.rows[0]

  // Test Insufficient Gold Guard: User B has 0 gold, attempts to buy
  let insufficientGoldPrevented = false
  try {
    await client.query('SELECT public.purchase_item_rpc($1, $2) as result', [affordableItem.id, userBId])
  } catch (err) {
    insufficientGoldPrevented = true
    console.log('  -> Caught expected Insufficient Gold rejection:', err.message)
  }

  if (!insufficientGoldPrevented) {
    throw new Error('TEST 6 FAILED: Purchase allowed with 0 gold.')
  }

  // User A has 350 gold from quests 1 & 2, buys affordableItem (price <= 100)
  const purchaseRes = await client.query('SELECT public.purchase_item_rpc($1, $2) as result', [affordableItem.id, userAId])
  const purchaseData = purchaseRes.rows[0].result

  console.log('  -> Purchase Result:', JSON.stringify(purchaseData))
  if (!purchaseData.success || purchaseData.remainingGold !== (350 - affordableItem.price)) {
    throw new Error('TEST 6 FAILED: Purchase gold calculation incorrect.')
  }

  // Test Duplicate Purchase Guard
  let duplicatePurchasePrevented = false
  try {
    await client.query('SELECT public.purchase_item_rpc($1, $2) as result', [affordableItem.id, userAId])
  } catch (err) {
    duplicatePurchasePrevented = true
    console.log('  -> Caught expected duplicate purchase rejection:', err.message)
  }

  if (!duplicatePurchasePrevented) {
    throw new Error('TEST 6 FAILED: Duplicate purchase was allowed.')
  }
  console.log('  -> PASS: Economy transactions atomic, insufficient gold blocked, duplicate purchases rejected.')

  // 7. Test Achievement Unlocks
  console.log('\n[TEST 7] Testing Achievement Unlocks & Persistence...')
  const userAAchRes = await client.query(`
    SELECT a.code, a.title FROM public.user_achievements ua
    JOIN public.achievements a ON ua.achievement_id = a.id
    WHERE ua.user_id = $1
  `, [userAId])

  console.log('  -> User A Unlocked Achievements:', userAAchRes.rows.map(r => r.code).join(', '))
  const codes = userAAchRes.rows.map(r => r.code)
  if (!codes.includes('FIRST_QUEST') || !codes.includes('FIRST_PURCHASE')) {
    throw new Error('TEST 7 FAILED: Expected FIRST_QUEST and FIRST_PURCHASE achievements.')
  }
  console.log('  -> PASS: Automated achievement triggers persisted correctly.')

  // Cleanup test users
  await client.query('DELETE FROM public.profiles WHERE id IN ($1, $2)', [userAId, userBId])
  console.log('  -> Cleaned up test data.')

  console.log('\n=================================================================')
  console.log('ALL 7 INTEGRATION & SECURITY SUITE TESTS PASSED WITH 100% SUCCESS')
  console.log('=================================================================\n')
  await client.end()
}

runTests().catch(err => {
  console.error('\nTEST SUITE FAILED:', err)
  client.end()
  process.exit(1)
})
