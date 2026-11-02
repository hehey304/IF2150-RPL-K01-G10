// I-07 Keranjang & Mode Layanan  (Pelanggan.pilihMetodeBayar tahap 1)
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useKeranjangStore } from '../../store/keranjangStore';
import { pilihMetodeBayar } from '../../api/pesanan';

const rp = (n: number) => 'Rp ' + n.toLocaleString('id-ID');
const TIPE = [
  { v: 'E_WALLET', l: 'Dompet digital (e-wallet)' },
  { v: 'TRANSFER_BANK', l: 'Virtual account bank' },
  { v: 'QRIS', l: 'QRIS' },
];

export default function KeranjangPage() {
  const nav = useNavigate();
  const k = useKeranjangStore();
  const [tipe, setTipe] = useState('E_WALLET');
  const [err, setErr] = useState('');
  const [habis, setHabis] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const lanjut = async () => {
    setErr(''); setHabis([]);
    if (!k.restoranId) return setErr('Restoran tidak valid');

    // Jika mode BUKAN booking, keranjang wajib terisi
    if (k.modePemesanan !== 'BOOKING' && k.daftarMenu.length === 0) {
      return setErr('Keranjang masih kosong');
    }

    // Validasi jika jadwal booking belum dipilih
    if (k.modePemesanan === 'BOOKING' && (!k.tanggalBooking || !k.slotWaktuBooking)) {
      return nav('/pelanggan/booking'); // Mengarahkan ke JadwalBookingPage.tsx[cite: 3]
    }

    setLoading(true); 
    try {
      const tagihan = await pilihMetodeBayar({
        restoranId: k.restoranId, 
        modePemesanan: k.modePemesanan,
        jumlahRombongan: k.modePemesanan === 'TAKEAWAY' ? undefined : k.jumlahRombongan,
        tanggalBooking: k.tanggalBooking ?? undefined, 
        slotWaktuBooking: k.slotWaktuBooking ?? undefined,
        // Jika keranjang kosong pada mode booking, items dikirim sebagai array kosong []
        items: k.daftarMenu.map(i => ({ menuId: i.menu.menuId, jumlah: i.jumlah })),
        tipePembayaran: tipe,
      });
      nav('/pelanggan/pembayaran', { state: { tagihan, tipe } }); // Lanjut ke PembayaranPage.tsx[cite: 5]
    } catch (e: any) {
      setErr(e?.message ?? 'Terjadi kesalahan');
      if (e?.code === 'STOK_HABIS') setHabis((e.data ?? []).map((x: any) => x.menuId));
      if (e?.code === 'BOOKING_TIDAK_VALID') nav('/pelanggan/booking');                
    } finally { 
      setLoading(false); 
    }
  };

  return (
    <div style={{ maxWidth: 560, margin: '0 auto', padding: 16 }}>
      <h2>Keranjang</h2>
      <fieldset>
        <legend>Mode layanan</legend>
        {(['DINE_IN', 'TAKEAWAY', 'BOOKING'] as const).map(m => (
          <label key={m} style={{ marginRight: 12 }}>
            <input type="radio" checked={k.modePemesanan === m} onChange={() => k.setMode(m)} />
            {m === 'DINE_IN' ? 'Dine-in' : m === 'TAKEAWAY' ? 'Takeaway' : 'Booking tempat'}
          </label>
        ))}
      </fieldset>
      {k.modePemesanan !== 'TAKEAWAY' && k.modePemesanan !== 'BOOKING' && (
        <p>Jumlah rombongan:{' '}
          <button onClick={() => k.setRombongan(k.jumlahRombongan - 1)}>−</button>
          {' '}{k.jumlahRombongan}{' '}
          <button onClick={() => k.setRombongan(k.jumlahRombongan + 1)}>+</button></p>
      )}
      {k.modePemesanan === 'BOOKING' && (
        <p>Jadwal: {k.tanggalBooking ? `${k.tanggalBooking} ${k.slotWaktuBooking} (${k.jumlahRombongan} orang)` : 'belum dipilih'}{' '}
          <button onClick={() => nav('/pelanggan/booking')}>Pilih jadwal</button></p>
      )}

      {k.daftarMenu.length === 0 && <p>Keranjang kosong.</p>}
      {k.daftarMenu.map(i => (
        <div key={i.menu.menuId} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0',
          color: habis.includes(i.menu.menuId) ? 'crimson' : undefined }}>
          <span>{i.menu.namaMenu} {habis.includes(i.menu.menuId) && '(habis)'}</span>
          <span>
            <button onClick={() => k.ubahJumlah(i.menu.menuId, -1)}>−</button> {i.jumlah}{' '}
            <button onClick={() => k.ubahJumlah(i.menu.menuId, 1)}>+</button> {rp(i.menu.harga * i.jumlah)}
          </span>
        </div>
      ))}
      <button onClick={() => nav(-1)}>+ Tambah menu</button>

      <h3>Ringkasan</h3>
      <p>Total: <b>{rp(k.hitungTotal())}</b></p>
      <label>Metode bayar:{' '}
        <select value={tipe} onChange={e => setTipe(e.target.value)}>
          {TIPE.map(t => <option key={t.v} value={t.v}>{t.l}</option>)}
        </select>
      </label>
      {loading && <p>Stok dan meja diperiksa ulang…</p>}
      {err && <p style={{ color: 'crimson' }}>{err}</p>}
      <p><button disabled={loading} onClick={lanjut}>Lanjut ke pembayaran</button></p>
    </div>
  );
}
