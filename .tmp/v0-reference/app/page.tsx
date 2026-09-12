'use client'

import { useState } from 'react'
import { Award, ArrowUpRight, BookOpen, Check, ChevronRight, CircleDot, Crown, Flame, Gem, Lock, Menu, Package, Plus, Shield, Sparkles, Swords, Target, Trophy, Zap, X } from 'lucide-react'

const attributes = [
  ['STR', 'Strength', 68, 'Physical energy and follow-through'],
  ['INT', 'Intellect', 84, 'Learning, clarity, and problem solving'],
  ['DISC', 'Discipline', 76, 'Keeping promises to yourself'],
  ['VIT', 'Vitality', 61, 'Energy, recovery, and presence'],
  ['CRE', 'Creativity', 89, 'Making new paths from raw ideas'],
] as const

const navItems = [
  { label: 'Character', icon: Shield }, { label: 'Quests', icon: Target },
  { label: 'Quest Chains', icon: Swords }, { label: 'Inventory', icon: Package }, { label: 'Achievements', icon: Trophy },
]

const questData = [
  { id: 'focus', title: 'Deep work block', meta: 'DISCIPLINE', detail: 'Protect 90 minutes for the work that matters most.', xp: 120, reward: 'FOCUS SHARD', icon: Target, tone: 'amber', time: 'TODAY' },
  { id: 'train', title: 'Morning training', meta: 'VITALITY', detail: 'Move your body before the day starts moving you.', xp: 50, reward: 'IRON WILL', icon: Flame, tone: 'red', time: 'TODAY' },
  { id: 'read', title: 'Read 20 pages', meta: 'INTELLECT', detail: 'Feed the mind with one chapter of something useful.', xp: 35, reward: 'INSIGHT', icon: BookOpen, tone: 'blue', time: 'SEP 13' },
]

const inventoryItems = [
  { name: 'FOCUS SHARD', type: 'Consumable', count: 3, icon: Gem, tone: 'amber' },
  { name: 'IRON WILL', type: 'Trait token', count: 1, icon: Shield, tone: 'blue' },
  { name: 'FIELD NOTES', type: 'Knowledge', count: 12, icon: BookOpen, tone: 'red' },
  { name: 'BUILDER\'S KEY', type: 'Rare artifact', count: 1, icon: Crown, tone: 'amber' },
]

const chains = [
  { title: 'THE FIRST MILESTONE', detail: 'Build your foundation', done: 2, total: 5, xp: 500 },
  { title: 'THE DAILY ENGINE', detail: 'Make consistency automatic', done: 4, total: 7, xp: 750 },
  { title: 'SHIP THE THING', detail: 'Turn ideas into evidence', done: 1, total: 4, xp: 900 },
]

const achievements = [
  { title: 'Architect of Momentum', detail: 'Complete a 7-day streak', progress: 'UNLOCKED', icon: Flame },
  { title: 'First Blood', detail: 'Complete your first quest', progress: 'UNLOCKED', icon: Swords },
  { title: 'The Long Game', detail: 'Reach a 21-day streak', progress: '14 / 21 DAYS', icon: Trophy },
  { title: 'Polymath', detail: 'Raise three attributes above 80', progress: '2 / 3 ATTRIBUTES', icon: Award },
]

export default function Home() {
  const [activeNav, setActiveNav] = useState('Character')
  const [showMobileNav, setShowMobileNav] = useState(false)
  const [completed, setCompleted] = useState<string[]>([])
  const [celebrated, setCelebrated] = useState(false)
  const [equipped, setEquipped] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [completion, setCompletion] = useState<string | null>(null)

  const completeQuest = (id: string) => { setCompleted((current) => current.includes(id) ? current : [...current, id]); setCompletion(id); setCelebrated(true) }
  const goTo = (label: string) => { setActiveNav(label); setShowMobileNav(false) }

  return <main className="min-h-screen bg-background text-foreground">
    <div className="scanlines" aria-hidden="true" />
    <aside className={`sidebar ${showMobileNav ? 'mobile-open' : ''}`}>
      <div className="brand"><span className="brand-mark">L</span><span>LIFE<span className="brand-slash">//</span>OS</span></div>
      <div className="side-label">OPERATING SYSTEM</div>
      <nav aria-label="Primary navigation" className="nav-list">{navItems.map(({ label, icon: Icon }) => <button key={label} className={`nav-item ${activeNav === label ? 'active' : ''}`} onClick={() => goTo(label)} aria-current={activeNav === label ? 'page' : undefined}><Icon size={17} strokeWidth={1.8} /><span>{label}</span>{activeNav === label && <ChevronRight size={14} className="nav-arrow" />}</button>)}</nav>
      <div className="sidebar-bottom"><div className="side-label">SYSTEM STATUS</div><div className="status-line"><CircleDot size={12} /><span>All systems nominal</span></div><div className="version">LIFE//OS v1.4.2 <span>•</span> BETA</div></div>
    </aside>
    <section className="content-shell">
      <header className="topbar"><button className="mobile-menu" aria-label="Open navigation" aria-expanded={showMobileNav} onClick={() => setShowMobileNav(!showMobileNav)}><Menu size={20} /></button><div className="breadcrumb"><span>CHARACTER</span><ChevronRight size={13} /><strong>{activeNav.toUpperCase()}</strong></div><div className="top-actions"><button className="icon-button" aria-label="Open inventory" onClick={() => goTo('Inventory')}><Gem size={18} /></button><div className="profile-chip"><span className="avatar">JD</span><span className="profile-name">JORDAN D.</span><span className="online-dot" /></div></div></header>
      <div className="page-content">
        {activeNav === 'Character' && <CharacterView onNavigate={goTo} onCelebrate={() => setCelebrated(true)} />}
        {activeNav === 'Quests' && <QuestView completed={completed} onComplete={completeQuest} onCreate={() => setShowCreate(true)} />}
        {activeNav === 'Quest Chains' && <ChainsView />}
        {activeNav === 'Inventory' && <InventoryView equipped={equipped} onEquip={setEquipped} />}
        {activeNav === 'Achievements' && <AchievementsView />}
      </div>
    </section>
    {celebrated && <div className="toast" role="status"><span className="toast-icon"><Sparkles size={15} /></span><div><b>QUEST REWARD CLAIMED</b><span>YOUR CHARACTER IS MOVING FORWARD</span></div><button onClick={() => setCelebrated(false)} aria-label="Dismiss notification">×</button></div>}
    {showCreate && <CreateQuestModal onClose={() => setShowCreate(false)} />}
    {completion && <CompletionModal quest={questData.find((quest) => quest.id === completion)!} onClose={() => setCompletion(null)} />}
  </main>
}

function PageIntro({ eyebrow, title, action }: { eyebrow: string; title: string; action?: React.ReactNode }) { return <div className="hero-heading"><div><p className="eyebrow">{eyebrow}</p><h1>{title}</h1></div>{action}</div> }
function CharacterView({ onNavigate, onCelebrate }: { onNavigate: (label: string) => void; onCelebrate: () => void }) { return <>
  <PageIntro eyebrow="CHARACTER PROGRESSION · SEPTEMBER 12, 2026" title={<>SEE WHO YOU&apos;RE <em>BECOMING.</em></>} action={<button className="quick-add" onClick={onCelebrate}><Sparkles size={15} /> REFLECT ON THIS BUILD</button>} />
  <section className="level-banner panel" aria-labelledby="level-title"><div className="level-orbit" aria-hidden="true"><span>13</span><i /><i /><i /></div><div className="level-copy"><p className="eyebrow">CURRENT LEVEL</p><h2 id="level-title">LEVEL 13</h2><p>Each completed quest is becoming part of your character.</p><div className="xp-line"><span>8,420 XP</span><span>10,000 XP</span></div><div className="progress-track" role="progressbar" aria-label="Experience progress" aria-valuenow={84} aria-valuemin={0} aria-valuemax={100}><div className="progress-fill" style={{ width: '84%' }} /></div><small>1,580 XP TO LEVEL 14</small></div><div className="build-stamp"><span>CURRENT BUILD</span><strong>THE BUILDER</strong><em>High Intellect<br />+ Creativity</em></div></section>
  <div className="progression-grid"><section className="panel attributes-panel"><div className="section-heading"><div><p className="eyebrow">YOUR CAPABILITIES</p><h2>ATTRIBUTES</h2></div><span className="panel-code">BUILD 01</span></div><div className="attribute-list">{attributes.map(([short, name, value, detail]) => <div className="progression-attribute" key={short}><div className="attribute-top"><span className="attribute-name">{short}</span><div className="attribute-label"><strong>{name}</strong><small>{detail}</small></div><b>{value}</b></div><div className="attribute-track" role="progressbar" aria-label={`${name} level`} aria-valuenow={value} aria-valuemin={0} aria-valuemax={100}><div style={{ width: `${value}%` }} /></div></div>)}</div></section><aside className="side-progression"><section className="panel rhythm-panel"><div className="section-heading"><div><p className="eyebrow">YOUR RHYTHM</p><h2>MOMENTUM</h2></div><Zap size={18} className="amber-icon" /></div><div className="rhythm-stats"><div><strong>07</strong><span>CURRENT<br />STREAK</span></div><div><strong>21</strong><span>LONGEST<br />STREAK</span></div><div><strong>82<small>%</small></strong><span>MOMENTUM<br />INDEX</span></div></div><div className="rhythm-note"><Flame size={15} /> You&apos;re building a pattern worth keeping.</div></section><section className="panel title-panel"><Award size={18} /><div><p className="eyebrow">ACTIVE TITLE</p><h3>ARCHITECT OF MOMENTUM</h3><span>Unlocked at level 12</span></div></section></aside></div>
  <div className="lower-grid progression-lower"><section className="lower-panel panel"><div className="section-heading"><div><p className="eyebrow">RECENT PROOF</p><h2>ACHIEVEMENTS</h2></div><button className="text-button" onClick={() => onNavigate('Achievements')}>VIEW ALL <ArrowUpRight size={14} /></button></div><div className="achievement-list">{achievements.slice(0, 3).map(({ title, detail, icon: Icon }) => <div className="achievement-row" key={title}><span className="achievement-icon"><Icon size={16} /></span><div><strong>{title}</strong><span>{detail}</span></div><b>UNLOCKED</b></div>)}</div></section><section className="lower-panel panel"><div className="section-heading"><div><p className="eyebrow">ACTIVE PATH</p><h2>QUEST CHAINS</h2></div><button className="text-button" onClick={() => onNavigate('Quest Chains')}>EXPLORE <ArrowUpRight size={14} /></button></div><div className="chain-row"><div className="chain-badge"><Swords size={19} /></div><div className="chain-info"><h3>THE FIRST MILESTONE</h3><p>Build your foundation · 2 of 5 complete</p><div className="mini-track"><div style={{ width: '40%' }} /></div></div><span className="chain-xp">+500 XP</span></div></section></div>
</> }

function QuestView({ completed, onComplete, onCreate }: { completed: string[]; onComplete: (id: string) => void; onCreate: () => void }) { return <><PageIntro eyebrow="ACTIVE MISSIONS · 03 AVAILABLE" title={<>MAKE TODAY <em>COUNT.</em></>} action={<button className="quick-add" onClick={onCreate}><Plus size={15} /> CREATE QUEST</button>} /><div className="quest-page-grid"><section><div className="section-heading"><div><p className="eyebrow">TODAY&apos;S BOARD</p><h2>QUESTS <span>({questData.length - completed.length} REMAINING)</span></h2></div></div><div className="quest-list">{questData.map(({ id, title, meta, detail, xp, reward, icon: Icon, tone, time }) => { const done = completed.includes(id); return <article className={`quest-card ${done ? 'completed' : ''}`} key={id}><span className={`quest-icon ${tone}`}><Icon size={19} /></span><div className="quest-main"><div className="quest-meta"><span>{meta}</span><i /><span className="quest-time">{time}</span></div><h3>{title}</h3><p className="quest-detail">{detail}</p><div className="rewards"><span><Zap size={13} /> +{xp} XP</span><span><Gem size={13} /> {reward}</span></div></div><button className={`complete-button ${done ? 'done' : ''}`} disabled={done} onClick={() => onComplete(id)}>{done ? <><Check size={13} /> COMPLETE</> : 'COMPLETE QUEST'}</button></article> })}</div></section><aside className="mission-aside panel"><p className="eyebrow">QUEST LOG</p><h2>THE NEXT RIGHT THING</h2><p>Small evidence compounds. Choose one quest, complete it, and let the reward remind you who you are becoming.</p><div className="aside-rule" /><span className="eyebrow">DAILY COMPLETION</span><strong className="big-number">{completed.length} / 3</strong><div className="mini-track"><div style={{ width: `${completed.length / 3 * 100}%` }} /></div></aside></div></> }

function ChainsView() { return <><PageIntro eyebrow="LONG-TERM PROGRESSION · 03 PATHS" title={<>FOLLOW THE <em>THREAD.</em></>} action={<button className="quick-add"><Swords size={15} /> NEW CHAIN</button>} /><div className="chains-grid">{chains.map((chain) => <article className="panel chain-card" key={chain.title}><div className="chain-card-top"><span className="chain-badge"><Swords size={19} /></span><span className="eyebrow">ACTIVE PATH</span><b>+{chain.xp} XP</b></div><h2>{chain.title}</h2><p>{chain.detail}</p><div className="chain-progress-row"><span>{chain.done} / {chain.total} QUESTS</span><strong>{Math.round(chain.done / chain.total * 100)}%</strong></div><div className="progress-track"><div className="progress-fill" style={{ width: `${chain.done / chain.total * 100}%` }} /></div><button className="text-button">VIEW QUESTS <ArrowUpRight size={14} /></button></article>)}</div></> }

function InventoryView({ equipped, onEquip }: { equipped: string; onEquip: (item: string) => void }) { return <><PageIntro eyebrow="PERSONAL LOADOUT · 04 ITEMS" title={<>CARRY WHAT <em>MATTERS.</em></>} action={<button className="quick-add"><Package size={15} /> SORT INVENTORY</button>} /><section className="inventory-layout"><div className="inventory-grid">{inventoryItems.map(({ name, type, count, icon: Icon, tone }) => <article className={`panel inventory-card ${equipped === name ? 'equipped' : ''}`} key={name}><div className={`item-icon ${tone}-item`}><Icon size={22} /></div><div><h2>{name}</h2><p>{type}</p></div><span className="item-count">x{count}</span><button className="equip-button" onClick={() => onEquip(equipped === name ? '' : name)}>{equipped === name ? <><Check size={13} /> EQUIPPED</> : 'EQUIP'}</button></article>)}</div><aside className="loadout panel"><p className="eyebrow">CURRENT LOADOUT</p><h2>{equipped || 'EMPTY SLOT'}</h2><p>{equipped ? 'This item is active in your current build.' : 'Choose an item to make it part of your current build.'}</p><div className="loadout-mark"><Package size={28} /></div></aside></section></> }

function CreateQuestModal({ onClose }: { onClose: () => void }) { return <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="create-quest-title"><div className="quest-modal panel"><button className="modal-close" onClick={onClose} aria-label="Close create quest"><X size={17} /></button><p className="eyebrow">QUEST FORGING · NEW ENTRY</p><h2 id="create-quest-title">CREATE NEW QUEST</h2><p className="modal-copy">Every completed quest becomes part of your character.</p><div className="quest-form"><label>TITLE<input placeholder="Name the mission" autoFocus /></label><label>DESCRIPTION<textarea placeholder="What does completion look like?" rows={3} /></label><div className="form-row"><label>CATEGORY<select defaultValue="BUILD"><option>BUILD</option><option>LEARN</option><option>MOVE</option><option>REFLECT</option></select></label><label>DIFFICULTY<select defaultValue="HARD"><option>EASY</option><option>MEDIUM</option><option>HARD</option></select></label></div><label>ATTRIBUTE<select defaultValue="INTELLECT"><option>INTELLECT</option><option>VITALITY</option><option>DISCIPLINE</option><option>CREATIVITY</option></select></label></div><div className="reward-preview"><p className="eyebrow">QUEST REWARD</p><strong>+140 XP <span>·</span> +40 GOLD</strong><span>INTELLECT +10</span></div><button className="quick-add modal-submit" onClick={onClose}><Swords size={15} /> ADD TO QUEST BOARD</button></div></div> }

function CompletionModal({ quest, onClose }: { quest: (typeof questData)[number]; onClose: () => void }) { return <div className="modal-backdrop completion-backdrop" role="dialog" aria-modal="true" aria-labelledby="completion-title"><div className="completion-modal panel"><button className="modal-close" onClick={onClose} aria-label="Close reward"><X size={17} /></button><span className="completion-mark"><Check size={24} /></span><p className="eyebrow">QUEST COMPLETE</p><h2 id="completion-title">{quest.title.toUpperCase()}</h2><div className="reward-burst"><strong>+{quest.xp} XP</strong><strong>+40 GOLD</strong><span>{quest.meta} +10</span></div><div className="level-shift"><span>LEVEL 13</span><ChevronRight size={16} /><b>LEVEL 14</b></div><p className="modal-copy">The evidence is real. Keep building the character you want to become.</p><button className="quick-add modal-submit" onClick={onClose}>CONTINUE <ArrowUpRight size={14} /></button></div></div> }

function AchievementsView() { return <><PageIntro eyebrow="PROOF OF WORK · 02 UNLOCKED" title={<>LEAVE A <em>TRACE.</em></>} action={<button className="quick-add"><Trophy size={15} /> VIEW REWARDS</button>} /><div className="achievement-page-grid"><section className="achievement-wall">{achievements.map(({ title, detail, progress, icon: Icon }) => <article className={`panel achievement-card ${progress === 'UNLOCKED' ? 'unlocked' : ''}`} key={title}><span className="achievement-icon"><Icon size={21} /></span><div><p className="eyebrow">{progress === 'UNLOCKED' ? 'UNLOCKED' : 'IN PROGRESS'}</p><h2>{title}</h2><p>{detail}</p></div><strong>{progress}</strong></article>)}</section><aside className="achievement-score panel"><Trophy size={25} /><p className="eyebrow">TOTAL SCORE</p><strong>2,840</strong><span>ACHIEVEMENT XP</span><div className="aside-rule" /><p className="eyebrow">NEXT UNLOCK</p><h3>THE LONG GAME</h3><p>Keep the streak alive for 7 more days.</p></aside></div></> }
