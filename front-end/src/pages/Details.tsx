import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'
import Spinner from '../components/Spinner'
import { useRole } from '../hooks/useRole'

type Cab = {
  chave: string; ROL:number; DatEnt:string|null; CodCli:string|null; CodTipEnt:string|null;
  TotPecas:number|null; Loja:string|null; Priority:'URG'|'NOR'; concluido:0|1
}
type Item = { Quantidade:number|null; Obs:string|null }

export default function Details() {
  const { chave = '' } = useParams()
  const [cab, setCab] = useState<Cab|undefined>()
  const [itens, setItens] = useState<Item[]>([])
  const nav = useNavigate()
  const { isAdminOwner, isRecep } = useRole()
  const [loading, setLoading] = useState(true)
  useEffect(()=> {
    async function load() {
      setLoading(true);
      const { data: dc } = await supabase
        .from('vw_movcab_priority').select('*').eq('chave', chave).limit(1)
      setCab(dc?.[0] as Cab)
      const { data: di } = await supabase
        .from('MovItem').select('Quantidade,Obs').eq('chave', chave).limit(200)
      setItens((di||[]) as Item[])
      setLoading(false)
    }
    load()
  }, [chave])
  async function setStatus(status:string) {
    const { error } = await supabase.from('MovCab').update({ status }).eq('chave', chave)
    if (error) return alert(error.message)
    alert('Status atualizado.')
  }
  async function darBaixa() {
    if (!confirm('Confirmar baixa?')) return
    const { error } = await supabase.from('MovCab').update({ concluido: 1 }).eq('chave', chave)
    if (error) { alert(error.message); return }
    alert('Baixa realizada.'); nav(-1)
  }
  if (loading || !cab) return <Spinner/>
  if (!cab) return <div className="container py-3">Carregando…</div>
  return (
    <div className="container py-3">
      <div className="text-center my-3"><img src="/logo.png" height={48}/></div>
      <div className="d-flex gap-3 flex-wrap">
        <div className="flex-grow-1">
          <div className="d-flex gap-3">
            <div className="badge text-bg-secondary">Loja: {cab.Loja}</div>
            <div className="badge text-bg-primary">ROL: {cab.ROL}</div>
          </div>
          <div className="mt-3">
            <div><b>Data Entrega:</b> {cab.DatEnt}</div>
            <div><b>Cliente:</b> {cab.CodCli}</div>
            <div><b>Despacho:</b> {cab.CodTipEnt==='E'?'Entrega': cab.CodTipEnt==='R'?'Retirada': cab.CodTipEnt}</div>
            <div><b>Total Peças:</b> {cab.TotPecas}</div>
            <div><b>Prioridade:</b> {cab.Priority==='URG'?'Urgente':'Normal'}</div>
            <div><b>Status:</b> {cab.concluido===1 ? 'Concluído' : 'Pendente'}</div>
          </div>
        </div>
      </div>

      <h5 className="mt-4">Itens</h5>
      {itens.length === 0 ? <p>Nenhum item.</p> :
        <ul>{itens.map((it, i)=>(<li key={i}>Qtd: {it.Quantidade}{it.Obs && it.Obs!=='NULL' ? ` — ${it.Obs}`:''}</li>))}</ul>
      }

      <div className="container d-flex justify-content-center gap-2 flex-wrap">
  {(isAdminOwner || isRecep) && cab.concluido===0 && (
    <>
      <button className="btn btn-outline-secondary" onClick={()=>setStatus('em transporte')}>
        <i className="bi bi-truck me-1"></i> Em transporte
      </button>
      <button className="btn btn-outline-primary" onClick={()=>setStatus('lavando')}>Lavando</button>
      <button className="btn btn-outline-primary" onClick={()=>setStatus('secando')}>Secando</button>
      <button className="btn btn-outline-primary" onClick={()=>setStatus('passando')}>Passando</button>
      <button className="btn btn-outline-primary" onClick={()=>setStatus('lavando a seco')}>Lavando a seco</button>
      <button className="btn btn-success" onClick={()=>setStatus('pronta')}>
        <i className="bi bi-check-circle me-1"></i> Marcar Pronta
      </button>
    </>
  )}
  <button className="btn btn-secondary" onClick={()=>nav(-1)}>Voltar</button>
</div>

    </div>
  )
}
