import { useState, type SyntheticEvent } from "react";
import { Link, useNavigate } from 'react-router-dom';
import { registerApi } from '../../api/auth';

export default function RegistrasiPage() {
  const [form, setForm] = useState({ nama: '', username: '', email: '', noHp: '', password: '' });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [k]: e.target.value });

  async function onSubmit(e: SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    try {
      await registerApi(form);
      navigate('/login', { state: { registered: true } });
    } catch (err: any) {
      setError(err.message);
    }
  }

  return (
    <form onSubmit={onSubmit} className="max-w-sm mx-auto mt-20 space-y-3">
      <h1 className="text-2xl font-bold">Daftar</h1>
      {error && <p className="text-red-600 text-sm">{error}</p>}
      <input placeholder="Nama lengkap" value={form.nama} onChange={set('nama')} className="border p-2 w-full" required />
      <input placeholder="Username" value={form.username} onChange={set('username')} className="border p-2 w-full" required />
      <input type="email" placeholder="Email" value={form.email} onChange={set('email')} className="border p-2 w-full" required />
      <input placeholder="No. HP" value={form.noHp} onChange={set('noHp')} className="border p-2 w-full" />
      <input type="password" placeholder="Password (min 8 karakter)" value={form.password}
        onChange={set('password')} className="border p-2 w-full" minLength={8} required />
      <button className="bg-black text-white p-2 w-full">Daftar</button>
      <p className="text-sm">Sudah punya akun? <Link to="/login" className="underline">Masuk</Link></p>
    </form>
  );
}