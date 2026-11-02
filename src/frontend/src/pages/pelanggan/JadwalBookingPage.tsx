// I-08 Pilih Jadwal Booking (validasi akhir ada di server: Pesanan.validasiBooking / Algo-039)
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useKeranjangStore } from '../../store/keranjangStore';
import { getSlotBooking } from '../../api/pesanan';

const iso = (d: Date) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);

export default function JadwalBookingPage() {
  const nav = useNavigate();
  const k = useKeranjangStore();
  const hari = useMemo(() => Array.from({ length: 8 }, (_, i) => { const d = new Date(); d.setDate(d.getDate() + i); return iso(d); }), []);
  const [tgl, setTgl] = useState(k.tanggalBooking ?? hari[0]);
  const [slot, setSlot] = useState(k.slotWaktuBooking);
  const [slots, setSlots] = useState<{ slot: string; tersedia: boolean }[]>([]);
  const [err, setErr] = useState('');

  useEffect(() => {
    if (!k.restoranId) return;
    setSlot(null);
    getSlotBooking(k.restoranId, tgl).then(setSlots).catch(() => setErr('Gagal memuat slot'));
  }, [tgl, k.restoranId]);

  const simpan = () => {
    if (!slot) return setErr('Pilih jam kedatangan');
    k.setJadwal(tgl, slot);
    nav('/pelanggan/keranjang');
  };

  return (
    <div style={{ maxWidth: 560, margin: '0 auto', padding: 16 }}>
      <button onClick={() => nav('/pelanggan/keranjang')}>‹ Kembali ke keranjang</button>
      <h2>Pilih Jadwal Booking</h2>
      <p><i>Reservasi hanya bisa untuk 7 hari ke depan</i></p>
      <select value={tgl} onChange={e => setTgl(e.target.value)}>
        {hari.map(h => <option key={h} value={h}>{h}</option>)}
      </select>
      <div style={{ margin: '12px 0' }}>
        {slots.map(s => (
          <button key={s.slot} disabled={!s.tersedia} onClick={() => setSlot(s.slot)}
            style={{ marginRight: 8, fontWeight: slot === s.slot ? 'bold' : undefined }}>
            {s.slot} · {s.tersedia ? 'Tersedia' : 'Penuh'}
          </button>
        ))}
      </div>
      <p>Jumlah kursi:{' '}
        <button onClick={() => k.setRombongan(k.jumlahRombongan - 1)}>−</button> {k.jumlahRombongan}{' '}
        <button onClick={() => k.setRombongan(k.jumlahRombongan + 1)}>+</button></p>
      <p>Jadwal dipilih: {slot ? `${tgl} ${slot}, ${k.jumlahRombongan} orang` : '-'}</p>
      {err && <p style={{ color: 'crimson' }}>{err}</p>}
      <button onClick={simpan}>Simpan jadwal</button>{' '}
      <button onClick={() => nav('/pelanggan/keranjang')}>Batal</button>
    </div>
  );
}
