import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { RedefinirPasswordForm } from '@/components/redefinir-password-form'
import { getSession } from '@/lib/session'

export default async function RedefinirPasswordPage() {
  const session = await getSession()
  if (session?.user) redirect('/')
  return (
    <Suspense>
      <RedefinirPasswordForm />
    </Suspense>
  )
}
