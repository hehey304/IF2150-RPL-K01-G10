import { Router } from 'express';
import * as ctl from '../controllers/pesananController.js';
import { authenticate } from '../middleware/auth.js'; // ASUMSI nama export; sesuaikan dengan middleware/auth.ts
 
const r = Router();
r.use(authenticate);
r.get('/restoran/:id/menu', ctl.menuRestoran);                            // sementara, untuk I-06
r.get('/booking/slot', ctl.slotBooking);                                  // I-08
r.post('/pesanan/tagihan', ctl.pilihMetodeBayar);                         // I-07/I-09 (Algo-004)
r.get('/pesanan/:id', ctl.lihatPesanan);                                  // I-09/I-10
r.post('/pembayaran/:idPembayaran/konfirmasi', ctl.konfirmasiPembayaran); // I-09 "Bayar sekarang" (Algo-005)
export default r;