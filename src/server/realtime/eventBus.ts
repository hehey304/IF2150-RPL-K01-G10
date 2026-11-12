import { EventEmitter } from 'node:events';

/**
 * Kanal real-time internal. Setiap perubahan antrean suatu restoran dipancarkan
 * pada kanal "antrean:<restoranId>" lalu diteruskan ke klien lewat Server-Sent Events
 * oleh PemantauAntreanController.
 */
class EventBus extends EventEmitter {
  antreanBerubah(restoranId: string, alasan: string): void {
    this.emit(`antrean:${restoranId}`, { restoranId, alasan, waktu: new Date().toISOString() });
  }
}

export const eventBus = new EventBus();
eventBus.setMaxListeners(0);
