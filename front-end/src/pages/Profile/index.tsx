import Navbar from '../../components/NavBar';

export default function Profile() {
  return (
    <>
      <Navbar isAdminOwner={false} />
      <div className="container py-3">
        <h2>Perfil</h2>
        <p>Dados do usuário…</p>
      </div>
    </>
  );
}
