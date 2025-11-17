interface Props {
  page: number
  perPage: number
  rowsLength: number
  onPageChange: (page: number) => void
}

export default function Pagination({ page, perPage, rowsLength, onPageChange }: Props) {
  return (
    <div className="d-flex gap-2 justify-content-center my-3">
      <button
        className="btn btn-outline-secondary"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
      >
        Anterior
      </button>
      <span className="align-self-center">Pág. {page}</span>
      <button
        className="btn btn-outline-secondary"
        disabled={rowsLength < perPage}
        onClick={() => onPageChange(page + 1)}
      >
        Próxima
      </button>
    </div>
  )
}
