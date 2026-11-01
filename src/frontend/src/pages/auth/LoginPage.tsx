import { useState, type SyntheticEvent } from "react";
import { Link, useNavigate } from 'react-router-dom';
import { loginApi } from '../../api/auth';
import { useAuthStore } from '../../store/authStore';
import { HOME_BY_ROLE } from '../../types';

export default function LoginPage() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const setAuth = useAuthStore((s) => s.setAuth);
  const navigate = useNavigate();

  async function onSubmit(e: SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { token, user } = await loginApi(identifier, password);
      setAuth(token, user);
      navigate(HOME_BY_ROLE[user.role], { replace: true }); // redirect based on role
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="max-w-sm mx-auto mt-20 space-y-3">
      <h1 className="text-2xl font-bold">Masuk</h1>
      {error && <p className="text-red-600 text-sm">{error}</p>}
      <input value={identifier} onChange={(e) => setIdentifier(e.target.value)}
        placeholder="Username atau email" className="border p-2 w-full" required />
      <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
        placeholder="Password" className="border p-2 w-full" required />
      <button disabled={loading} className="bg-black text-white p-2 w-full">
        {loading ? 'Memproses...' : 'Masuk'}
      </button>
      <p className="text-sm">
        Belum punya akun? <Link to="/registrasi" className="underline">Daftar</Link>
        {' · '}
        <Link to="/restoran/registrasi" className="underline">Daftar sebagai restoran</Link>
      </p>
    </form>
  );
}