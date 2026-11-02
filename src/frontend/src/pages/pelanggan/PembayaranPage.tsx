// I-09 Pembayaran. Memuat Pesanan.showOrderDetails (Algo-044) + Pelanggan.konfirmasiPembayaran (Algo-005).
import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useKeranjangStore } from '../../store/keranjangStore';
import { konfirmasiPembayaran, getDetailPesanan, type Tagihan } from '../../api/pesanan';

const rp = (n: number) => 'Rp ' + Number(n).toLocaleString('id-ID');

export default function PembayaranPage() {
  const nav = useNavigate();
  const { state } = useLocation() as { state?: { tagihan: Tagihan; tipe: string } };
  const tagihan = state?.tagihan;
  const kosongkan = useKeranjangStore(s => s.kosongkanKeranjang);
  const [detail, setDetail] = useState<any>(null);
  const [sisa, setSisa] = useState(0);
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => { if (tagihan) getDetailPesanan(tagihan.pesananId).then(setDetail).catch(() => {}); }, [tagihan]);

  // Hitung mundur (KNF07). Server tetap menjadi sumber kebenaran lewat cekTimeout + cek batas waktu saat verifikasi.
  useEffect(() => {
    if (!tagihan) return;
    const t = setInterval(() => setSisa(Math.max(0, Math.floor((new Date(tagihan.batasWaktuBayar).getTime() - Date.now()) / 1000))), 500);
    return () => clearInterval(t);
  }, [tagihan]);

  if (!tagihan) return <p>Tidak ada tagihan. <button onClick={() => nav('/pelanggan/keranjang')}>Ke keranjang</button></p>;
  const habis = sisa === 0 && new Date(tagihan.batasWaktuBayar).getTime() <= Date.now();

  const bayar = async () => {
    setErr(''); setLoading(true);
    try {
      const hasil = await konfirmasiPembayaran(tagihan.idPembayaran);
      kosongkan();
      nav(`/pelanggan/tiket/${hasil.pesananId}`, { state: { tiket: hasil.tiket } }); // I-10
    } catch (e: any) { setErr(e?.message ?? 'Terjadi kesalahan'); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ maxWidth: 560, margin: '0 auto', padding: 16 }}>
      <h2>Pembayaran</h2>
      <p>{habis ? 'Batas waktu pembayaran habis. Transaksi dibatalkan'
               : `Selesaikan pembayaran dalam ${String(Math.floor(sisa / 60)).padStart(2, '0')}:${String(sisa % 60).padStart(2, '0')}`}</p>
      {detail && ( // showOrderDetails
        <div>
          <h3>Rincian pesanan</h3>
          <p>Mode: {detail.modePemesanan}</p>
          {detail.modePemesanan === 'BOOKING' && <p>Jadwal: {detail.tanggalBooking} {detail.slotWaktuBooking} · {detail.jumlahRombongan} orang</p>}
          {detail.daftarItem.map((i: any) => <div key={i.menuId}>{i.namaMenu} × {i.jumlah} — {rp(i.subtotal)}</div>)}
          <p>Status: {detail.statusPemesanan}</p>
        </div>
      )}
      <p>Kode bayar: <b>{tagihan.kodeBayar}</b></p>
      <p>Total tagihan: <b>{rp(tagihan.totalHarga)}</b></p>
      {err && <p style={{ color: 'crimson' }}>{err}</p>}
      <button disabled={loading || habis} onClick={bayar}>Bayar sekarang</button>{' '}
      {habis && <button onClick={() => nav('/pelanggan/keranjang')}>Kembali ke keranjang</button>}
      <p><small>Pesanan dibatalkan otomatis jika waktu habis.</small></p>
    </div>
  );
}
