import { redirect } from 'next/navigation'
import { EsqueciPasswordForm } from '@/components/esqueci-password-form'
import { getSession } from '@/lib/session'

export default async function EsqueciPasswordPage() {
  const session = await getSession()
  if (session?.user) redirect('/')
  return <EsqueciPasswordForm />
}
