'use client'

import { useCallback, useRef, useState } from 'react'

/**
 * Achado F07 (docs/audit/USABILITY_FINDINGS.md) — evita perder um
 * formulário longo por um clique acidental fora do diálogo ou Escape.
 * Intercepta o fecho do `Dialog` (`onOpenChange`) e, se algum campo tiver
 * sido alterado face ao estado com que o diálogo abriu, pede confirmação
 * antes de fechar de facto.
 *
 * A fotografia inicial é tirada numa ref callback (`formRef`), não num
 * `useEffect` — o `<form>` vive dentro de um `DialogPortal`, cuja
 * montagem real no DOM pode ficar um tick React atrasada em relação ao
 * `useEffect` deste hook (guardas internas de montagem só no cliente);
 * uma ref callback corre exatamente quando o nó é anexado, sem essa
 * corrida de tempo. Cada vez que o `<form>` é montado de novo (cada
 * abertura do diálogo) conta como um novo ponto de partida.
 *
 * Compara o `FormData` nativo do formulário contra essa fotografia — não
 * basta "não vazio", porque campos com valor por omissão (ex. uma
 * checkbox já marcada) tornariam o aviso permanente mesmo sem qualquer
 * interação do utilizador. Cobre `<input>`/`<textarea>` com `name`. Não
 * deteta, de propósito (para manter este primeiro passo simples e de
 * baixo risco), escolhas feitas só em `Select` controlados por estado
 * React sem `<input>` nativo associado. Aplicado para já só a
 * `NovoMovimentoDialog` (o exemplo citado no achado); candidato a
 * reutilizar noutros diálogos longos.
 */
export function useConfirmarFecho(
  open: boolean,
  setOpen: (open: boolean) => void,
) {
  const formElRef = useRef<HTMLFormElement | null>(null)
  const estadoInicialRef = useRef<Record<string, string> | null>(null)
  const [avisoAbandonoAberto, setAvisoAbandonoAberto] = useState(false)

  const formRef = useCallback((node: HTMLFormElement | null) => {
    formElRef.current = node
    estadoInicialRef.current = node
      ? (Object.fromEntries(new FormData(node).entries()) as Record<string, string>)
      : null
  }, [])

  const formFoiAlterado = () => {
    const form = formElRef.current
    const inicial = estadoInicialRef.current
    if (!form || !inicial) return false
    const atual = Object.fromEntries(new FormData(form).entries()) as Record<string, string>
    const chaves = new Set([...Object.keys(inicial), ...Object.keys(atual)])
    for (const chave of chaves) {
      if ((inicial[chave] ?? '') !== (atual[chave] ?? '')) return true
    }
    return false
  }

  const onOpenChange = (novoEstado: boolean) => {
    if (!novoEstado && open && formFoiAlterado()) {
      setAvisoAbandonoAberto(true)
      return
    }
    setOpen(novoEstado)
  }

  const confirmarAbandono = () => {
    setAvisoAbandonoAberto(false)
    setOpen(false)
  }

  const cancelarAbandono = () => setAvisoAbandonoAberto(false)

  return { formRef, onOpenChange, avisoAbandonoAberto, confirmarAbandono, cancelarAbandono }
}
