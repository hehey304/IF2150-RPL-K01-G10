// I-10 Tiket Antrean. Memuat TiketAntrean.cetakRincianTiket (klien).
import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { getDetailPesanan, type Tiket } from '../../api/pesanan';

export default function TiketAntreanPage() {
  const nav = useNavigate();
  const { pesananId } = useParams();
  const { state } = useLocation() as { state?: { tiket: Tiket | null } };
  const [tiket, setTiket] = useState<any>(state?.tiket ?? null);
  const [mode, setMode] = useState('');

  useEffect(() => { // dipakai juga saat halaman di-refresh
    if (!pesananId) return;
    getDetailPesanan(pesananId).then(d => {
      setMode(d.modePemesanan);
      if (d.tiket) setTiket({ nomorUrut: d.tiket.nomor_urut, tipeAntrean: d.tiket.tipe_antrean,
        waktuTerbit: d.tiket.waktu_terbit, estimasiWaktuTunggu: d.tiket.estimasi_waktu_tunggu });
    }).catch(() => {});
  }, [pesananId]);

  return (
    <div style={{ maxWidth: 560, margin: '0 auto', padding: 16, textAlign: 'center' }}>
      <h2>✓ Pembayaran berhasil</h2>
      {tiket ? ( // cetakRincianTiket
        <>
          <p>Nomor antrean Anda</p>
          <div style={{ fontSize: 64, fontWeight: 'bold' }}>{tiket.nomorUrut}</div>
          <p>Tipe: {tiket.tipeAntrean}</p>
          <p>Terbit: {new Date(tiket.waktuTerbit).toLocaleString('id-ID')}</p>
          <p>Estimasi tunggu: {tiket.estimasiWaktuTunggu} menit</p>
        </>
      ) : mode === 'BOOKING' ? <p>Pembayaran berhasil, booking Anda telah dikonfirmasi</p> : <p>Memuat tiket…</p>}
      <button onClick={() => nav('/pelanggan/antrean')}>Lihat status antrean</button>
    </div>
  );
}
