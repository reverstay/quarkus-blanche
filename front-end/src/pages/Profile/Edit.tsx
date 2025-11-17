import Navbar from '../../components/NavBar';

export default function EditProfile() {
  return (
    <>
      <Navbar isAdminOwner={false} />
      <div className="container py-3">
        <h2>Editar Perfil</h2>
        <form className="mt-3" style={{ maxWidth: 520 }}>
          <div className="mb-3">
            <label className="form-label">Nome</label>
            <input className="form-control" />
          </div>
          <div className="mb-3">
            <label className="form-label">Email</label>
            <input type="email" className="form-control" />
          </div>
          <button className="btn btn-primary">Salvar</button>
        </form>
      </div>
    </>
  );
}