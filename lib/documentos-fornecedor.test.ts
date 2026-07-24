import { describe, expect, it } from 'vitest'
import { calcularEstadoDocumentoFornecedor } from './documentos-fornecedor'

describe('calcularEstadoDocumentoFornecedor', () => {
  it('sem pagamentos é "por_liquidar"', () => {
    expect(calcularEstadoDocumentoFornecedor(100, 0)).toBe('por_liquidar')
  })

  it('um documento de valor 0 sem pagamentos continua "por_liquidar", não "liquidado"', () => {
    expect(calcularEstadoDocumentoFornecedor(0, 0)).toBe('por_liquidar')
  })

  it('pago abaixo do valor é "parcial"', () => {
    expect(calcularEstadoDocumentoFornecedor(100, 40)).toBe('parcial')
  })

  it('pago exatamente igual ao valor é "liquidado"', () => {
    expect(calcularEstadoDocumentoFornecedor(100, 100)).toBe('liquidado')
  })

  it('pago acima do valor continua "liquidado" (excesso sinalizado à parte, não aqui)', () => {
    expect(calcularEstadoDocumentoFornecedor(100, 130)).toBe('liquidado')
  })
})
