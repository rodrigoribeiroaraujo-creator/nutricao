'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { getPaciente, getSuplemtacoes, getSession, type Paciente, type Suplementacao } from '@/lib/supabase'
import { calcIdadeAnos } from '@/lib/who'

function idadeStr(dataNasc: string) {
  const anos = calcIdadeAnos(dataNasc)
  if (anos < 2) return `${Math.round(anos * 12)} meses`
  return `${Math.floor(anos)} anos e ${Math.round((anos % 1) * 12)} meses`
}

export default function SuplemtacaoPDF() {
  const { id } = useParams<{ id: string }>()
  const [paciente, setPaciente] = useState<Paciente | null>(null)
  const [sups, setSups] = useState<Suplementacao[]>([])
  const [nutricionista, setNutricionista] = useState('')
  const [ready, setReady] = useState(false)

  useEffect(() => {
    getSession().then(async session => {
      if (!session) { window.close(); return }
      const [pac, suplementacoes] = await Promise.all([
        getPaciente(id),
        getSuplemtacoes(id),
      ])
      setPaciente(pac)
      setSups(suplementacoes)
      setNutricionista(session.user.email ?? '')
      setReady(true)
    })
  }, [id])

  if (!ready || !paciente) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', fontFamily: 'sans-serif', color: '#78716c' }}>
        <p>Preparando documento...</p>
      </div>
    )
  }

  const hoje = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
  const idadePaciente = idadeStr(paciente.data_nascimento)

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

        /* Header do consultório */
        .clinic-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          border-bottom: 3px solid #c2410c;
          padding-bottom: 20px;
          margin-bottom: 28px;
        }
        .clinic-name {
          font-size: 22px;
          font-weight: 700;
          color: #c2410c;
          letter-spacing: -0.5px;
          font-family: 'Georgia', serif;
        }
        .clinic-sub {
          font-size: 11px;
          color: #78716c;
          margin-top: 3px;
          font-family: sans-serif;
        }
        .doc-date {
          font-size: 11px;
          color: #78716c;
          text-align: right;
          font-family: sans-serif;
          line-height: 1.6;
        }

        /* Título */
        .doc-title {
          font-size: 16px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 1.5px;
          color: #292524;
          margin-bottom: 20px;
          font-family: sans-serif;
          text-align: center;
        }

        /* Dados do paciente */
        .patient-box {
          background: #fafaf9;
          border: 1px solid #e7e5e4;
          border-radius: 8px;
          padding: 16px 20px;
          margin-bottom: 28px;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px 32px;
        }
        .patient-field label {
          font-size: 9px;
          font-family: sans-serif;
          text-transform: uppercase;
          letter-spacing: 1px;
          color: #a8a29e;
          display: block;
          margin-bottom: 2px;
        }
        .patient-field span {
          font-size: 13px;
          color: #1c1917;
          font-family: sans-serif;
          font-weight: 600;
        }

        /* Tabela de suplementação */
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 32px;
          font-family: sans-serif;
        }
        thead tr {
          background: #c2410c;
          color: #fff;
        }
        thead th {
          padding: 10px 12px;
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.8px;
          font-weight: 700;
          text-align: left;
        }
        thead th:last-child { text-align: right; }
        tbody tr:nth-child(even) { background: #fafaf9; }
        tbody tr { border-bottom: 1px solid #f5f5f4; }
        tbody td {
          padding: 10px 12px;
          font-size: 12px;
          color: #292524;
          vertical-align: middle;
        }
        tbody td:last-child { text-align: right; }
        .dose-value { font-weight: 700; font-size: 13px; color: #c2410c; }
        .ref-text { font-size: 10px; color: #78716c; margin-top: 1px; }
        .ul-warning { font-size: 10px; color: #dc2626; font-weight: 600; }

        /* Rodapé */
        .footer {
          margin-top: 48px;
          padding-top: 20px;
          border-top: 1px solid #e7e5e4;
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          font-family: sans-serif;
        }
        .signature-block {
          text-align: center;
        }
        .signature-line {
          width: 220px;
          border-bottom: 1px solid #292524;
          margin-bottom: 6px;
          height: 36px;
        }
        .signature-label {
          font-size: 10px;
          color: #78716c;
        }
        .ref-note {
          font-size: 9px;
          color: #a8a29e;
          max-width: 280px;
          line-height: 1.5;
        }

        /* Ocultar na impressão o botão de print */
        .no-print { display: flex; justify-content: center; margin-bottom: 32px; gap: 12px; }
        @media print {
          .no-print { display: none !important; }
          .page { padding: 32px 48px; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}</style>

      <div className="page">
        {/* Botões visíveis na tela, ocultos na impressão */}
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
            <div>Data: {hoje}</div>
          </div>
        </div>

        {/* Título */}
        <div className="doc-title">Prescrição de Suplementação</div>

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
            <span>{idadePaciente}</span>
          </div>
          <div className="patient-field">
            <label>Sexo</label>
            <span>{paciente.sexo === 'M' ? 'Masculino' : 'Feminino'}</span>
          </div>
        </div>

        {/* Tabela */}
        {sups.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#a8a29e', fontFamily: 'sans-serif', padding: '32px' }}>
            Nenhum suplemento prescrito.
          </p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Suplemento</th>
                <th>Dose prescrita</th>
                <th>Referência DRI</th>
                <th style={{ textAlign: 'right' }}>Observações</th>
              </tr>
            </thead>
            <tbody>
              {sups.map(s => {
                const excessoUL = s.ul != null && s.dose_prescrita > s.ul
                const pct = s.dose_dri ? Math.round((s.dose_prescrita / s.dose_dri) * 100) : null
                return (
                  <tr key={s.id}>
                    <td><strong>{s.nutriente_nome}</strong></td>
                    <td>
                      <div className="dose-value">{s.dose_prescrita} {s.unidade}</div>
                      {pct != null && <div className="ref-text">{pct}% da referência</div>}
                      {excessoUL && <div className="ul-warning">⚠ Acima do UL</div>}
                    </td>
                    <td>
                      {s.dose_dri != null
                        ? <div className="ref-text">{s.is_ai ? 'AI' : 'RDA'}: {s.dose_dri} {s.unidade}{s.ul != null ? ` · UL: ${s.ul} ${s.unidade}` : ''}</div>
                        : <div className="ref-text">—</div>
                      }
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div className="ref-text">{s.observacoes ?? '—'}</div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}

        {/* Rodapé com assinatura */}
        <div className="footer">
          <div className="ref-note">
            Referências: Padovani et al., Rev. Nutr. 2006;19(6):741-760.<br />
            Institute of Medicine — Dietary Reference Intakes (1997-2005).
          </div>
          <div className="signature-block">
            <div className="signature-line" />
            <div className="signature-label">Nutricionista responsável</div>
            <div className="signature-label" style={{ marginTop: 2, color: '#c2410c', fontWeight: 600 }}>
              {nutricionista}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
