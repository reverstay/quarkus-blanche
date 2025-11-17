import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../../supabase'
import FilterBar, { type Filters } from '../../components/FilterBar'
import Spinner from '../../components/Spinner'
import Navbar from '../../components/NavBar'
import CardGrid from '../../components/CardGrid'
import Pagination from '../../components/Pagination'
import { useRealtime } from '../../hooks/useRealtime'
import { useCache } from '../../hooks/useCache'
import { useRole } from '../../hooks/useRole'
import { useSettings } from '../../hooks/useSettings'
import { useLojaColors } from '../../hooks/useLojaColors'
import { useUserLojas } from '../../hooks/useUserLojas'
import { type CardData } from '../../components/Card'

function tomorrowISO() {
  const d = new Date(); d.setDate(d.getDate() + 1); d.setHours(0, 0, 0, 0)
  return d.toISOString().slice(0, 10)
}

export default function Home() {
  const nav = useNavigate()
  const { isAdminOwner } = useRole()
  const { daysBack, daysAhead } = useSettings()
  const lojaColors = useLojaColors()
  const { lojas: lojasPermitidas } = useUserLojas()

  const [sp, setSp] = useSearchParams()
  const [filters, setFilters] = useState<Filters>({ per_page: 20 })
  const [page, setPage] = useState(1)
  const [tick, setTick] = useState(0)
  const [count, setCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [rows, setRows] = useState<CardData[]>([])

  const from = useMemo(() => (page - 1) * (filters.per_page || 20), [page, filters.per_page])
  const to = useMemo(() => from + (filters.per_page || 20) - 1, [from, filters.per_page])

  // Realtime invalida cache/lista
  const onDbChange = useCallback(() => setTick(t => t + 1), [])
  useRealtime(onDbChange)

  // Lojas globais (cache) — só p/ admins
  const { data: lojasData } = useCache<{ Loja: string }[]>(
    'lojas-global',
    async () => {
      const { data } = await supabase
        .from('MovCab')
        .select('Loja:loja')
        .not('loja', 'is', null)
        .order('loja', { ascending: true })
        .limit(1000)
      return (data || []) as any
    },
    60_000,
    tick
  )
  const lojasGlobais = useMemo(
    () => Array.from(new Set((lojasData || []).map(d => d.Loja))).filter(Boolean) as string[],
    [lojasData]
  )

  // Inicializa filtros pela URL ou defaults
  useEffect(() => {
    const initStart = sp.get('start_date')
    const initEnd = sp.get('end_date')
    const defaultStart = (() => {
      const d = new Date(); d.setDate(d.getDate() - (daysBack ?? 0)); return d.toISOString().slice(0, 10)
    })()
    const defaultEnd = (() => {
      if (daysBack === 0 && daysAhead === 1) return tomorrowISO()
      const d = new Date(); d.setDate(d.getDate() + (daysAhead ?? 1)); return d.toISOString().slice(0, 10)
    })()

    const lojaUrl = sp.get('loja') || undefined
    const lojaDefault = isAdminOwner
      ? lojaUrl
      : (lojaUrl && lojasPermitidas.includes(lojaUrl)) ? lojaUrl
      : (lojasPermitidas[0] || undefined)

    const f: Filters = {
      start_date: initStart || defaultStart,
      end_date: initEnd || defaultEnd,
      cod_tip_ent: (sp.get('cod_tip_ent') as any) || 'ALL',
      loja: lojaDefault,
      status: (sp.get('status') as any) || 'ALL',
      priority: (sp.get('priority') as any) || 'ALL',
      search_rol: sp.get('search_rol') || undefined,
      per_page: Number(sp.get('per_page') || 20),
    }
    setFilters(f)
    setPage(Number(sp.get('page') || 1))
  }, [daysBack, daysAhead, isAdminOwner, lojasPermitidas.join('|')])

  // Escreve filtros na URL
  useEffect(() => {
    const params: Record<string, string> = { page: String(page), per_page: String(filters.per_page) }
    if (filters.start_date) params.start_date = filters.start_date
    if (filters.end_date) params.end_date = filters.end_date
    if (filters.loja) params.loja = filters.loja
    if (filters.cod_tip_ent && filters.cod_tip_ent !== 'ALL') params.cod_tip_ent = filters.cod_tip_ent
    if (filters.status && filters.status !== 'ALL') params.status = filters.status
    if (filters.priority && filters.priority !== 'ALL') params.priority = filters.priority
    if (filters.search_rol) params.search_rol = filters.search_rol
    setSp(params, { replace: true })
  }, [filters, page, setSp])

  // Busca dados
  useEffect(() => {
    (async () => {
      setLoading(true)
      let q = supabase
        .from('vw_movcab_priority')
        .select('*', { count: 'exact', head: false })
        .order('priority_number', { ascending: true })
        .order('DatEnt', { ascending: true })
        .range(from, to)

      if (filters.start_date) q = q.gte('DatEnt', filters.start_date)
      if (filters.end_date) q = q.lte('DatEnt', filters.end_date)
      if (filters.cod_tip_ent && filters.cod_tip_ent !== 'ALL') q = q.eq('CodTipEnt', filters.cod_tip_ent)
      if (filters.status && filters.status !== 'ALL') q = q.eq('concluido', filters.status)
      if (filters.priority && filters.priority !== 'ALL') q = q.eq('Priority', filters.priority)
      if (filters.search_rol) q = q.ilike('ROL', `%${filters.search_rol}%`)
      if (filters.loja) q = q.eq('Loja', filters.loja)

      const { data, count, error } = await q
      if (error) console.error(error)
      setRows((data || []) as any)
      setCount(count || 0)
      setLoading(false)
    })()
  }, [filters, from, to, tick])

  const lojasParaFiltro = isAdminOwner ? lojasGlobais : lojasPermitidas

  return (
    <div className="container-fluid py-3">
      {/* Navbar */}
      <Navbar isAdminOwner={isAdminOwner} />

      {/* Filtros + contador */}
      <div className="mt-3 d-flex align-items-center justify-content-between flex-wrap gap-2">
        <FilterBar
          initial={filters}
          lojas={lojasParaFiltro}
          onApply={(f) => {
            const lojaOk = isAdminOwner ? f.loja : (f.loja && lojasPermitidas.includes(f.loja) ? f.loja : lojasPermitidas[0])
            setPage(1); setFilters({ ...f, loja: lojaOk })
          }}
        />
        <div> Total: <b>{count}</b> </div>
      </div>

      {/* Lista */}
      {loading ? <Spinner /> :
        <CardGrid rows={rows} lojaColors={lojaColors} />
      }

      {/* Paginação */}
      <Pagination
        page={page}
        perPage={filters.per_page || 20}
        rowsLength={rows.length}
        onPageChange={setPage}
      />
    </div>
  )
}
