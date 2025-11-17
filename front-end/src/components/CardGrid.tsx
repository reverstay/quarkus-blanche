import Card, { type CardData } from './Card'

interface Props {
  rows: CardData[]
  lojaColors: Record<string, string>
}

export default function CardGrid({ rows, lojaColors }: Props) {
  return (
    <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-3 mt-2">
      {rows.map((r) => (
        <div className="col" key={r.chave}>
          <Card d={r} lojaColor={r.Loja ? lojaColors[r.Loja] : undefined} />
        </div>
      ))}
    </div>
  )
}
