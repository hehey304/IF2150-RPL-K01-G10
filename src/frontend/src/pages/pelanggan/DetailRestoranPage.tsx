// I-06 Detail Restoran (versi minimal untuk UC02: daftar menu + tombol tambah ke keranjang).
// Gabungkan dengan fitur UC01 (info restoran, rating, dsb.) bila sudah ada.
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useKeranjangStore } from '../../store/keranjangStore';
import { getMenuRestoran, type MenuRestoran } from '../../api/pesanan';

const rp = (n: number) => 'Rp ' + n.toLocaleString('id-ID');

export default function DetailRestoranPage() {
  const params = useParams();
  const restoranId = params.id ?? params.restoranId ?? ''; // sesuaikan dengan nama param di routes/index.tsx
  const [nama, setNama] = useState('');
  const [menu, setMenu] = useState<MenuRestoran[]>([]);
  const [err, setErr] = useState('');

  // Hook dipanggil DI DALAM komponen
  const tambahItem = useKeranjangStore(s => s.tambahItem);   // = Pelanggan.pilihMenu
  const jumlahItem = useKeranjangStore(s => s.daftarMenu.reduce((n, i) => n + i.jumlah, 0));

  useEffect(() => {
    if (!restoranId) return;
    getMenuRestoran(restoranId)
      .then(d => { setNama(d.namaRestoran); setMenu(d.menu); })
      .catch(e => setErr(e.message));
  }, [restoranId]);

  return (
    <div style={{ maxWidth: 560, margin: '0 auto', padding: 16 }}>
      <h2>{nama || 'Detail Restoran'}</h2>
      {err && <p style={{ color: 'crimson' }}>{err}</p>}
      {menu.map(m => (
        <div key={m.menuId} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
          <span>
            <b>{m.namaMenu}</b> <small>{m.deskripsiMenu}</small><br />
            {rp(m.harga)} · stok {m.stok}
          </span>
          <button disabled={m.stok <= 0}
            onClick={() => tambahItem(restoranId, { menuId: m.menuId, namaMenu: m.namaMenu, harga: m.harga }, 1)}>
            {m.stok <= 0 ? 'Habis' : 'Tambah'}
          </button>
        </div>
      ))}
      <p><Link to="/pelanggan/keranjang">Lihat keranjang ({jumlahItem})</Link></p>
    </div>
  );
}
