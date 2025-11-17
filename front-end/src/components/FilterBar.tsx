// src/components/FilterBar.tsx
import { useState } from 'react'

export type Filters = {
  start_date?: string
  end_date?: string
  cod_tip_ent?: 'ALL' | 'R' | 'E'
  loja?: string
  status?: 'ALL' | '0' | '1'
  priority?: 'ALL' | 'URG' | 'NOR'
  search_rol?: string
  per_page: number
}

export default function FilterBar({
  initial,
  lojas,
  onApply,
}: {
  initial: Filters
  lojas: string[]
  onApply: (f: Filters) => void
}) {
  const [f, setF] = useState<Filters>(initial)

  return (
    <form
      className="d-flex flex-wrap gap-2 align-items-end"
      onSubmit={(e) => {
        e.preventDefault()
        onApply(f)
      }}
    >
      <div>
        <label className="form-label">Início</label>
        <input
          type="date"
          className="form-control"
          value={f.start_date || ''}
          onChange={(e) => setF({ ...f, start_date: e.target.value || undefined })}
        />
      </div>
      <div>
        <label className="form-label">Fim</label>
        <input
          type="date"
          className="form-control"
          value={f.end_date || ''}
          onChange={(e) => setF({ ...f, end_date: e.target.value || undefined })}
        />
      </div>
      <div>
        <label className="form-label">Entrega</label>
        <select
          className="form-select"
          value={f.cod_tip_ent || 'ALL'}
          onChange={(e) => setF({ ...f, cod_tip_ent: e.target.value as any })}
        >
          <option value="ALL">Todos</option>
          <option value="R">Retirada</option>
          <option value="E">Entrega</option>
        </select>
      </div>
      <div>
        <label className="form-label">Status</label>
        <select
          className="form-select"
          value={f.status || 'ALL'}
          onChange={(e) => setF({ ...f, status: e.target.value as any })}
        >
          <option value="ALL">Todos</option>
          <option value="1">Concluídos</option>
          <option value="0">Pendentes</option>
        </select>
      </div>
      <div>
        <label className="form-label">Prioridade</label>
        <select
          className="form-select"
          value={f.priority || 'ALL'}
          onChange={(e) => setF({ ...f, priority: e.target.value as any })}
        >
          <option value="ALL">Todos</option>
          <option value="URG">Urgente</option>
          <option value="NOR">Normal</option>
        </select>
      </div>
      <div>
        <label className="form-label">ROL</label>
        <input
          className="form-control"
          value={f.search_rol || ''}
          onChange={(e) => setF({ ...f, search_rol: e.target.value || undefined })}
        />
      </div>
      <div>
        <label className="form-label">Loja</label>
        <select
          className="form-select"
          value={f.loja || 'ALL'}
          onChange={(e) =>
            setF({ ...f, loja: e.target.value === 'ALL' ? undefined : e.target.value })
          }
        >
          <option value="ALL">Todas</option>
          {lojas.map((l) => (
            <option key={l} value={l}>
              {l}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="form-label">Por página</label>
        <select
          className="form-select"
          value={f.per_page}
          onChange={(e) => setF({ ...f, per_page: parseInt(e.target.value) })}
        >
          <option value={20}>20</option>
          <option value={30}>30</option>
        </select>
      </div>
      <button className="btn btn-primary">Filtrar</button>
    </form>
  )
}
