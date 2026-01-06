import ProfilePageClient from './ProfilePageClient'

// Disable static generation for this page since it requires authentication
export const dynamic = 'force-dynamic'

export default function ProfilePage() {
  return <ProfilePageClient />
}
