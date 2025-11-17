import { supabase } from '../supabase'
import { useNavigate } from 'react-router-dom'

interface Props {
  isAdminOwner: boolean
}

export default function Navbar({ isAdminOwner }: Props) {
  const nav = useNavigate()

  async function logout() {
    await supabase.auth.signOut()
    nav('/login', { replace: true })
  }

  return (
    <nav className="navbar navbar-dark" style={{ backgroundColor: '#337ab7' }}>
      <div className="container-fluid">
        <span className="navbar-brand d-flex align-items-center gap-2">
          <img src="/logo.png" height={30} alt="logo" /> Blanche Lavanderias
        </span>
        <div className="d-flex gap-2">
          <a className="btn btn-light" href="/novo">Novo Pedido</a>
          {isAdminOwner && <a className="btn btn-light" href="/admin">Admin</a>}
          <button className="btn btn-outline-light" onClick={logout}>Sair</button>
        </div>
      </div>
    </nav>
  )
}
