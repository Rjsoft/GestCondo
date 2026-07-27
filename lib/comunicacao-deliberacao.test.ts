import { describe, expect, it } from 'vitest'
import { calcularSituacaoComunicacao } from './comunicacao-deliberacao'

describe('calcularSituacaoComunicacao', () => {
  const dataAssembleia = new Date('2026-01-01')

  it('por comunicar, dentro do prazo de envio', () => {
    const hoje = new Date('2026-01-10')
    const r = calcularSituacaoComunicacao({ dataAssembleia, dataEnvio: null, resposta: null }, hoje)
    expect(r.situacao).toBe('por_comunicar')
    expect(r.envioEmAtraso).toBe(false)
  })

  it('por comunicar, prazo de envio (30 dias) ultrapassado', () => {
    const hoje = new Date('2026-02-05')
    const r = calcularSituacaoComunicacao({ dataAssembleia, dataEnvio: null, resposta: null }, hoje)
    expect(r.situacao).toBe('por_comunicar')
    expect(r.envioEmAtraso).toBe(true)
  })

  it('comunicado, ainda dentro do prazo de resposta (90 dias)', () => {
    const dataEnvio = new Date('2026-01-15')
    const hoje = new Date('2026-02-01')
    const r = calcularSituacaoComunicacao({ dataAssembleia, dataEnvio, resposta: null }, hoje)
    expect(r.situacao).toBe('aguarda_resposta')
    expect(r.respostaEmAtraso).toBe(false)
  })

  it('comunicado, prazo de resposta ultrapassado sem resposta — silêncio vale como aprovação', () => {
    const dataEnvio = new Date('2026-01-15')
    const hoje = new Date('2026-05-01')
    const r = calcularSituacaoComunicacao({ dataAssembleia, dataEnvio, resposta: null }, hoje)
    expect(r.situacao).toBe('silencio_aprovacao')
    expect(r.respostaEmAtraso).toBe(true)
  })

  it('resposta expressa de concordância, mesmo depois do prazo', () => {
    const dataEnvio = new Date('2026-01-15')
    const hoje = new Date('2026-05-01')
    const r = calcularSituacaoComunicacao({ dataAssembleia, dataEnvio, resposta: 'concordancia' }, hoje)
    expect(r.situacao).toBe('concordancia')
    expect(r.respostaEmAtraso).toBe(false)
  })

  it('resposta expressa de discordância', () => {
    const dataEnvio = new Date('2026-01-15')
    const hoje = new Date('2026-02-01')
    const r = calcularSituacaoComunicacao({ dataAssembleia, dataEnvio, resposta: 'discordancia' }, hoje)
    expect(r.situacao).toBe('discordancia')
  })

  it('prazoResposta é null enquanto não houver envio', () => {
    const r = calcularSituacaoComunicacao({ dataAssembleia, dataEnvio: null, resposta: null }, new Date('2026-01-05'))
    expect(r.prazoResposta).toBeNull()
  })
})
