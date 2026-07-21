import { describe, expect, it } from 'vitest'
import { validarFicheiro } from './storage'

const regras = { tipos: ['application/pdf', 'image/jpeg'], tamanhoMaximo: 1024 }

function ficheiro(tipo: string, tamanho: number) {
  return new File([new Uint8Array(tamanho)], 'ficheiro.bin', { type: tipo })
}

describe('validarFicheiro', () => {
  it('aceita um ficheiro com tipo e tamanho dentro das regras', () => {
    expect(() => validarFicheiro(ficheiro('application/pdf', 100), regras)).not.toThrow()
  })

  it('rejeita um tipo não permitido', () => {
    expect(() => validarFicheiro(ficheiro('application/zip', 100), regras)).toThrow(
      /Tipo de ficheiro não permitido/,
    )
  })

  it('rejeita um ficheiro acima do tamanho máximo', () => {
    expect(() => validarFicheiro(ficheiro('application/pdf', 2048), regras)).toThrow(
      /demasiado grande/,
    )
  })
})
