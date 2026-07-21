import { del, put } from '@vercel/blob'

export type PastaFicheiro = 'documentos' | 'ocorrencias' | 'seguros'

const REGRAS: Record<PastaFicheiro, { tipos: string[]; tamanhoMaximo: number }> = {
  documentos: {
    tipos: ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'],
    tamanhoMaximo: 15 * 1024 * 1024,
  },
  ocorrencias: {
    tipos: ['image/jpeg', 'image/png', 'image/webp'],
    tamanhoMaximo: 8 * 1024 * 1024,
  },
  seguros: {
    tipos: ['application/pdf'],
    tamanhoMaximo: 15 * 1024 * 1024,
  },
}

/**
 * Valida tipo e tamanho de um ficheiro antes de o guardar. Função pura
 * (sem rede) para poder ser testada sem depender do Vercel Blob.
 */
export function validarFicheiro(
  file: File,
  regras: { tipos: string[]; tamanhoMaximo: number },
) {
  if (!regras.tipos.includes(file.type)) {
    throw new Error(
      `Tipo de ficheiro não permitido (${file.type || 'desconhecido'}). Tipos aceites: ${regras.tipos.join(', ')}`,
    )
  }
  if (file.size > regras.tamanhoMaximo) {
    throw new Error(
      `Ficheiro demasiado grande (máximo ${Math.round(regras.tamanhoMaximo / (1024 * 1024))}MB)`,
    )
  }
}

/**
 * Guarda um ficheiro no Vercel Blob (bucket público — ver a nota sobre
 * controlo de acesso em FUNCTIONAL_GAPS.md secção 6: a proteção é a mesma
 * que já existia para `documento.url`, o link só é mostrado dentro de
 * páginas já protegidas por condominioId/perfil, não uma verificação por
 * pedido ao nível do armazenamento).
 */
export async function guardarFicheiro(file: File, pasta: PastaFicheiro) {
  validarFicheiro(file, REGRAS[pasta])
  const blob = await put(`${pasta}/${file.name}`, file, {
    access: 'public',
    addRandomSuffix: true,
  })
  return { url: blob.url, nomeFicheiro: file.name }
}

/**
 * Apaga um ficheiro do Vercel Blob. Nunca lança — mesmo contrato de
 * registarAuditoria (lib/audit.ts): uma falha a apagar o ficheiro não deve
 * impedir a eliminação do registo na base de dados que o referenciava.
 * Ignora silenciosamente valores que não sejam um URL do Blob (ex. um link
 * externo colado à mão em `documento.url`).
 */
export async function apagarFicheiro(url: string | null | undefined) {
  if (!url || !url.includes('.blob.vercel-storage.com')) return
  try {
    await del(url)
  } catch (e) {
    console.error('[storage] Falha ao apagar ficheiro:', e)
  }
}
