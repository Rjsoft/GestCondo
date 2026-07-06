import { describe, expect, it } from 'vitest'
import {
  PERFIS,
  podeEscrever,
  temAcessoFinanceiro,
  temConsultaGestao,
  temPermissaoGestao,
  type MembroSessao,
  type Perfil,
} from './perfis'

function membro(perfil: Perfil, isSuperAdmin = false): MembroSessao {
  return {
    id: 1,
    condominioId: 1,
    userId: 'user-1',
    nome: 'Teste',
    email: 'teste@exemplo.pt',
    perfil,
    estado: 'aprovado',
    fracao: null,
    isSuperAdmin,
  }
}

// Esta matriz é a definição de segurança que a aplicação depende para
// esconder finanças de inquilinos/fornecedores, bloquear escrita de
// auditores, etc. (ver SECURITY_AUDIT.md S8). Os valores aqui são
// intencionalmente escritos à mão, não derivados dos arrays PERFIS_* de
// lib/perfis.ts — o objetivo é detetar uma alteração acidental a esses
// arrays, não validar que o código é consistente consigo próprio.

describe('temPermissaoGestao (admin ou gestor podem escrever em qualquer módulo)', () => {
  const esperado: Record<Perfil, boolean> = {
    admin: true,
    gestor: true,
    condomino: false,
    inquilino: false,
    fornecedor: false,
    auditor: false,
  }

  for (const perfil of PERFIS) {
    it(`${perfil} → ${esperado[perfil]}`, () => {
      expect(temPermissaoGestao(membro(perfil))).toBe(esperado[perfil])
    })
  }

  it('super admin tem sempre permissão de gestão, independentemente do perfil', () => {
    for (const perfil of PERFIS) {
      expect(temPermissaoGestao(membro(perfil, true))).toBe(true)
    }
  })
})

describe('temConsultaGestao (admin, gestor e auditor consultam dados de gestão)', () => {
  const esperado: Record<Perfil, boolean> = {
    admin: true,
    gestor: true,
    condomino: false,
    inquilino: false,
    fornecedor: false,
    auditor: true,
  }

  for (const perfil of PERFIS) {
    it(`${perfil} → ${esperado[perfil]}`, () => {
      expect(temConsultaGestao(membro(perfil))).toBe(esperado[perfil])
    })
  }

  it('super admin tem sempre consulta de gestão', () => {
    for (const perfil of PERFIS) {
      expect(temConsultaGestao(membro(perfil, true))).toBe(true)
    }
  })
})

describe('temAcessoFinanceiro (inquilino e fornecedor nunca veem finanças/frações)', () => {
  const esperado: Record<Perfil, boolean> = {
    admin: true,
    gestor: true,
    condomino: true,
    inquilino: false,
    fornecedor: false,
    auditor: true,
  }

  for (const perfil of PERFIS) {
    it(`${perfil} → ${esperado[perfil]}`, () => {
      expect(temAcessoFinanceiro(membro(perfil))).toBe(esperado[perfil])
    })
  }

  it('super admin tem sempre acesso financeiro', () => {
    for (const perfil of PERFIS) {
      expect(temAcessoFinanceiro(membro(perfil, true))).toBe(true)
    }
  })
})

describe('podeEscrever (auditor é sempre só consulta)', () => {
  const esperado: Record<Perfil, boolean> = {
    admin: true,
    gestor: true,
    condomino: true,
    inquilino: true,
    fornecedor: true,
    auditor: false,
  }

  for (const perfil of PERFIS) {
    it(`${perfil} → ${esperado[perfil]}`, () => {
      expect(podeEscrever(membro(perfil))).toBe(esperado[perfil])
    })
  }

  it('super admin pode escrever mesmo com perfil auditor', () => {
    expect(podeEscrever(membro('auditor', true))).toBe(true)
  })
})
