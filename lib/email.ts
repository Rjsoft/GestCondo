// Envio de email transacional, sem depender de nenhum SDK — um simples
// fetch à API REST do Resend (https://resend.com). Se RESEND_API_KEY não
// estiver configurada (ex. ambiente de desenvolvimento local sem conta),
// o email não é enviado: o conteúdo fica registado na consola do servidor,
// para se poder testar o fluxo (reset de password, verificação de email)
// sem precisar de uma conta de email real. Nunca lança — uma falha de
// envio não deve impedir a operação que a desencadeou de ter sucesso.
export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string
  subject: string
  html: string
}) {
  const apiKey = process.env.RESEND_API_KEY

  if (!apiKey) {
    console.log(
      `[email] Modo local (sem RESEND_API_KEY) — email não enviado.\n` +
        `Para: ${to}\nAssunto: ${subject}\n${html}`,
    )
    return
  }

  const from = process.env.EMAIL_FROM || 'GestCondo <onboarding@resend.dev>'

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from, to, subject, html }),
    })
    if (!res.ok) {
      console.error('[email] Falha ao enviar via Resend:', res.status, await res.text())
    }
  } catch (e) {
    console.error('[email] Erro ao contactar o Resend:', e)
  }
}
