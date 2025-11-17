import { useNavigate } from 'react-router-dom'
import { fmtDate } from '../lib/format'

export type CardData = {
  chave: string; ROL: number; DatEnt: string|null; CodCli: string|null;
  CodTipEnt: 'E'|'R'|string|null; TotPecas: number|null; Loja: string|null;
  Priority: 'URG'|'NOR'; concluido:0|1; status?: string|null
}

const statusIcon: Record<string,string> = {
  'em transporte': 'bi-truck',
  'lavando': 'bi-droplet-half',
  'secando': 'bi-wind',
  'passando': 'bi-brush',
  'lavando a seco': 'bi-droplet',
  'pronta': 'bi-check-circle-fill'
}

export default function Card({ d, lojaColor }: { d: CardData, lojaColor?: string }) {
  const nav = useNavigate()
  const disp = d.CodTipEnt==='E' ? 'Entrega' : d.CodTipEnt==='R' ? 'Retirada' : d.CodTipEnt
  const dispIcon = d.CodTipEnt==='E' ? 'bi-truck' : d.CodTipEnt==='R' ? 'bi-shop' : 'bi-box'

  return (
    <div className="card clickable" onClick={()=>nav(`/detalhes/${encodeURIComponent(d.chave)}`)}
         style={{ borderLeft: `8px solid ${lojaColor || '#999'}` }}>
      <div className="card-body">
        <h5 className="card-title">ROL: {d.ROL}</h5>
        <p className="mb-1"><i className={`bi ${dispIcon} me-2`}></i><b>Despacho:</b> {disp}</p>
        <p className="mb-1"><i className="bi bi-calendar me-2"></i><b>Entrega:</b> {fmtDate(d.DatEnt)}</p>
        <p className="mb-1"><i className="bi bi-person me-2"></i><b>Cliente:</b> {d.CodCli}</p>
        <p className="mb-1"><i className="bi bi-list-ol me-2"></i><b>Peças:</b> {d.TotPecas}</p>
        <p className="mb-1"><i className="bi bi-geo-alt me-2"></i><b>Loja:</b> {d.Loja}</p>
        <p className="mb-1"><i className={`bi ${d.Priority==='URG'?'bi-exclamation-triangle-fill text-danger':'bi-flag' } me-2`}></i>
          <b>Prioridade:</b> {d.Priority==='URG'?'Urgente':'Normal'}</p>
        <p className="mb-0"><i className={`bi ${statusIcon[d.status||'']||'bi-hourglass-split'} me-2`}></i>
          <b>Status:</b> {d.concluido===1?'Pronta':'Pendente'}{d.status ? ` — ${d.status}` : ''}</p>
      </div>
    </div>
  )
}
