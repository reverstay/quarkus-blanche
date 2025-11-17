import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../supabase'
import { useRole } from '../../hooks/useRole'

export default function Novo() {
  const nav = useNavigate()
  const { isAdminOwner, isRecep, loja: myLoja } = useRole()
  const [ROL, setROL] = useState<number|''>('')
  const [CodCli, setCodCli] = useState('')
  const [DatEnt, setDatEnt] = useState<string>('')
  const [CodTipEnt, setCodTipEnt] = useState<'E'|'R'>('E')
  const [TotPecas, setTotPecas] = useState<number|''>('')

  const canCreate = isAdminOwner || isRecep
  useEffect(()=>{ if (!canCreate) nav('/', { replace:true }) }, [canCreate, nav])

  async function submit(e:React.FormEvent) {
    e.preventDefault()
    const payload: any = {
      ROL: ROL || null,
      CodCli: CodCli || null,
      DatEnt: DatEnt || null,
      CodTipEnt,
      TotPecas: TotPecas || null,
      loja: myLoja || null,
      status: 'lavando',
    }
    const { error } = await supabase.from('MovCab').insert(payload)
    if (error) return alert(error.message)
    alert('Pedido criado.'); nav('/')
  }

  return (
    <div className="container py-3">
      <h3>Novo Pedido</h3>
      <form className="row g-2" onSubmit={submit}>
        <div className="col-md-2"><label className="form-label">ROL</label>
          <input className="form-control" value={ROL} onChange={e=>setROL(e.target.value as any)} /></div>
        <div className="col-md-3"><label className="form-label">Cliente (CodCli)</label>
          <input className="form-control" value={CodCli} onChange={e=>setCodCli(e.target.value)} /></div>
        <div className="col-md-2"><label className="form-label">Data Entrega</label>
          <input type="date" className="form-control" value={DatEnt} onChange={e=>setDatEnt(e.target.value)} /></div>
        <div className="col-md-2"><label className="form-label">Tipo</label>
          <select className="form-select" value={CodTipEnt} onChange={e=>setCodTipEnt(e.target.value as any)}>
            <option value="E">Entrega</option><option value="R">Retirada</option>
          </select></div>
        <div className="col-md-2"><label className="form-label">Total Peças</label>
          <input type="number" className="form-control" value={TotPecas} onChange={e=>setTotPecas(parseInt(e.target.value)||'' as any)} /></div>
        <div className="col-12"><button className="btn btn-primary">Salvar</button></div>
      </form>
    </div>
  )
}
