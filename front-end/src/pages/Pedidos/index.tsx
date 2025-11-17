import Navbar from '../../components/NavBar';

export default function Pedidos() {
  return (
    <>
      <Navbar isAdminOwner={false} />
      <div className="container py-3">
        <h2>Pedidos</h2>
        <p>Lista/CRUD de pedidos…</p>
      </div>
    </>
  );
}
