import { redirect } from 'next/navigation'
import { getMembroAtual, getSession } from '@/lib/session'
import { OnboardingForm } from '@/components/onboarding-form'

export default async function OnboardingPage() {
  const session = await getSession()
  if (!session?.user) redirect('/sign-in')

  // Já tem membro (onboarding concluído noutra aba, por exemplo) — não faz
  // sentido mostrar este ecrã outra vez.
  const membro = await getMembroAtual()
  if (membro) redirect('/')

  return <OnboardingForm />
}
