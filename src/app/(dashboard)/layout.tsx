import { redirect } from 'next/navigation'
import { getCurrentUser, getCharacter } from '@/features/auth/actions'
import { Navigation } from '@/components/layout/Navigation'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/auth')
  }

  const character = await getCharacter()

  return (
    <div className="min-h-screen bg-[#0b0d0f]">
      <Navigation character={character} userEmail={user.email} />
      <main className="content-shell">
        <div className="page-content">{children}</div>
      </main>
    </div>
  )
}
