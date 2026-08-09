'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { getSession, getPaciente, getSessao, type Paciente, type Sessao } from '@/lib/supabase'
import { calcIdadeAnos } from '@/lib/who'

function idadeStr(dataNasc: string) {
  const anos = calcIdadeAnos(dataNasc)
  if (anos < 2) return `${Math.round(anos * 12)} meses`
  return `${Math.floor(anos)} anos e ${Math.round((anos % 1) * 12)} meses`
}

function fmtDate(iso: string) {
  return new Date(iso + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
}

const HUMOR_LABEL: Record<string, string> = {
  otimo: 'Ótimo 😄', bom: 'Bom 🙂', neutro: 'Neutro 😐', ruim: 'Ruim 😕', pessimo: 'Péssimo 😞',
}

const ADESAO_LABEL: Record<number, string> = {
  1: 'Péssima (1/5)', 2: 'Ruim (2/5)', 3: 'Regular (3/5)', 4: 'Boa (4/5)', 5: 'Ótima (5/5)',
}

export default function RelatorioPDF() {
  const { id, sessaoId } = useParams<{ id: string; sessaoId: string }>()
  const [paciente, setPaciente] = useState<Paciente | null>(null)
  const [sessao, setSessao] = useState<Sessao | null>(null)
  const [nutricionista, setNutricionista] = useState('')
  const [ready, setReady] = useState(false)

  useEffect(() => {
    getSession().then(async session => {
      if (!session) { window.close(); return }
      const [pac, sess] = await Promise.all([
        getPaciente(id),
        getSessao(sessaoId),
      ])
      setPaciente(pac)
      setSessao(sess)
      setNutricionista(session.user.email ?? '')
      setReady(true)
    })
  }, [id, sessaoId])

  if (!ready || !paciente || !sessao) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', fontFamily: 'sans-serif', color: '#78716c' }}>
        <p>Preparando relatório...</p>
      </div>
    )
  }

  const hoje = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
  const semanaNum = sessao.numero_sessao ?? '—'
  const adesaoPct = sessao.adesao ? Math.round((sessao.adesao / 5) * 100) : null

  return (
    <>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Georgia', serif; background: #fff; color: #1c1917; }

        .page {
          max-width: 720px;
          margin: 0 auto;
          padding: 48px 56px;
          min-height: 100vh;
        }

        .clinic-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          border-bottom: 3px solid #c2410c;
          padding-bottom: 20px;
          margin-bottom: 28px;
        }
        .clinic-name { font-size: 22px; font-weight: 700; color: #c2410c; letter-spacing: -0.5px; font-family: 'Georgia', serif; }
        .clinic-sub { font-size: 11px; color: #78716c; margin-top: 3px; font-family: sans-serif; }
        .doc-date { font-size: 11px; color: #78716c; text-align: right; font-family: sans-serif; line-height: 1.6; }

        .doc-title { font-size: 15px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; color: #292524; margin-bottom: 6px; font-family: sans-serif; text-align: center; }
        .doc-subtitle { font-size: 12px; color: #78716c; font-family: sans-serif; text-align: center; margin-bottom: 24px; }

        .patient-box {
          background: #fafaf9; border: 1px solid #e7e5e4; border-radius: 8px;
          padding: 16px 20px; margin-bottom: 24px;
          display: grid; grid-template-columns: 1fr 1fr; gap: 8px 32px;
        }
        .patient-field label { font-size: 9px; font-family: sans-serif; text-transform: uppercase; letter-spacing: 1px; color: #a8a29e; display: block; margin-bottom: 2px; }
        .patient-field span { font-size: 13px; color: #1c1917; font-family: sans-serif; font-weight: 600; }

        .section { margin-bottom: 20px; }
        .section-title { font-size: 10px; font-family: sans-serif; text-transform: uppercase; letter-spacing: 1px; color: #c2410c; font-weight: 700; margin-bottom: 10px; border-bottom: 1px solid #fde8e0; padding-bottom: 4px; }

        .metrics-row { display: flex; gap: 16px; margin-bottom: 20px; }
        .metric-box { flex: 1; background: #fafaf9; border: 1px solid #e7e5e4; border-radius: 8px; padding: 12px 16px; text-align: center; }
        .metric-value { font-size: 22px; font-weight: 700; color: #c2410c; font-family: sans-serif; }
        .metric-label { font-size: 9px; text-transform: uppercase; letter-spacing: 1px; color: #a8a29e; font-family: sans-serif; margin-top: 2px; }

        .adesao-bar { height: 8px; background: #f5f5f4; border-radius: 99px; margin-top: 6px; overflow: hidden; }
        .adesao-fill { height: 100%; background: #c2410c; border-radius: 99px; }

        .text-block { background: #fafaf9; border: 1px solid #e7e5e4; border-radius: 8px; padding: 14px 16px; }
        .text-block p { font-size: 12px; color: #292524; font-family: sans-serif; line-height: 1.7; white-space: pre-wrap; }

        .metas-box { background: #fff7f5; border: 1px solid #fde8e0; border-radius: 8px; padding: 14px 16px; }
        .metas-box p { font-size: 12px; color: #292524; font-family: sans-serif; line-height: 1.7; white-space: pre-wrap; }

        .footer { margin-top: 48px; padding-top: 20px; border-top: 1px solid #e7e5e4; display: flex; justify-content: space-between; align-items: flex-end; font-family: sans-serif; }
        .signature-block { text-align: center; }
        .signature-line { width: 220px; border-bottom: 1px solid #292524; margin-bottom: 6px; height: 36px; }
        .signature-label { font-size: 10px; color: #78716c; }
        .doc-number { font-size: 9px; color: #a8a29e; line-height: 1.6; }

        .no-print { display: flex; justify-content: center; margin-bottom: 32px; gap: 12px; }
        @media print {
          .no-print { display: none !important; }
          .page { padding: 32px 48px; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}</style>

      <div className="page">
        <div className="no-print">
          <button onClick={() => window.print()}
            style={{ background: '#c2410c', color: '#fff', border: 'none', borderRadius: '8px', padding: '10px 24px', fontFamily: 'sans-serif', fontWeight: 700, fontSize: '14px', cursor: 'pointer' }}>
            Imprimir / Salvar PDF
          </button>
          <button onClick={() => window.close()}
            style={{ background: '#f5f5f4', color: '#57534e', border: '1px solid #e7e5e4', borderRadius: '8px', padding: '10px 24px', fontFamily: 'sans-serif', fontWeight: 600, fontSize: '14px', cursor: 'pointer' }}>
            Fechar
          </button>
        </div>

        {/* Header */}
        <div className="clinic-header">
          <div>
            <div className="clinic-name">🌱 KR Nutri Pro</div>
            <div className="clinic-sub">Nutrição Clínica e Funcional</div>
          </div>
          <div className="doc-date">
            <div>Emitido em: {hoje}</div>
          </div>
        </div>

        {/* Título */}
        <div className="doc-title">Relatório de Acompanhamento Semanal</div>
        <div className="doc-subtitle">Sessão #{semanaNum} · {fmtDate(sessao.data_sessao)}</div>

        {/* Dados do paciente */}
        <div className="patient-box">
          <div className="patient-field">
            <label>Paciente</label>
            <span>{paciente.nome}</span>
          </div>
          <div className="patient-field">
            <label>Data de Nascimento</label>
            <span>{new Date(paciente.data_nascimento + 'T12:00:00').toLocaleDateString('pt-BR')}</span>
          </div>
          <div className="patient-field">
            <label>Idade</label>
            <span>{idadeStr(paciente.data_nascimento)}</span>
          </div>
          <div className="patient-field">
            <label>Sexo</label>
            <span>{paciente.sexo === 'M' ? 'Masculino' : 'Feminino'}</span>
          </div>
        </div>

        {/* Métricas da sessão */}
        <div className="metrics-row">
          {sessao.peso_kg != null && (
            <div className="metric-box">
              <div className="metric-value">{sessao.peso_kg} <span style={{ fontSize: '13px', fontWeight: 400, color: '#78716c' }}>kg</span></div>
              <div className="metric-label">Peso</div>
            </div>
          )}
          {sessao.adesao != null && (
            <div className="metric-box">
              <div className="metric-value">{sessao.adesao}<span style={{ fontSize: '13px', fontWeight: 400, color: '#78716c' }}>/5</span></div>
              <div className="metric-label">Adesão ao plano</div>
              <div className="adesao-bar">
                <div className="adesao-fill" style={{ width: `${adesaoPct}%` }} />
              </div>
            </div>
          )}
          {sessao.humor && (
            <div className="metric-box">
              <div className="metric-value" style={{ fontSize: '28px' }}>
                {sessao.humor === 'otimo' ? '😄' : sessao.humor === 'bom' ? '🙂' : sessao.humor === 'neutro' ? '😐' : sessao.humor === 'ruim' ? '😕' : '😞'}
              </div>
              <div className="metric-label">{sessao.humor === 'otimo' ? 'Ótimo' : sessao.humor === 'bom' ? 'Bom' : sessao.humor === 'neutro' ? 'Neutro' : sessao.humor === 'ruim' ? 'Ruim' : 'Péssimo'}</div>
            </div>
          )}
        </div>

        {/* Observações da sessão */}
        {sessao.observacoes && (
          <div className="section">
            <div className="section-title">Observações da sessão</div>
            <div className="text-block">
              <p>{sessao.observacoes}</p>
            </div>
          </div>
        )}

        {/* Metas próxima semana */}
        {sessao.metas_proximas && (
          <div className="section">
            <div className="section-title">Metas para a próxima semana</div>
            <div className="metas-box">
              <p>{sessao.metas_proximas}</p>
            </div>
          </div>
        )}

        {/* Rodapé */}
        <div className="footer">
          <div className="doc-number">
            <div>Paciente: {paciente.nome}</div>
            <div>Sessão #{semanaNum} de {new Date().getFullYear()}</div>
            <div style={{ marginTop: 4, color: '#c2410c' }}>KR Nutri Pro — Nutrição Clínica e Funcional</div>
          </div>
          <div className="signature-block">
            <div className="signature-line" />
            <div className="signature-label">Nutricionista responsável</div>
            <div className="signature-label" style={{ marginTop: 2, color: '#c2410c', fontWeight: 600 }}>{nutricionista}</div>
          </div>
        </div>
      </div>
    </>
  )
}
