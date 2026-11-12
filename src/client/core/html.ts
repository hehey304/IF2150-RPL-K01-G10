/** Template HTML aman: seluruh nilai disisipkan dengan escape kecuali dibungkus SafeHtml. */
export class SafeHtml {
  constructor(public readonly value: string) {}
  toString(): string {
    return this.value;
  }
}

const ESC: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
export const escapeHtml = (s: string): string => s.replace(/[&<>"']/g, (c) => ESC[c]);

function render(v: unknown): string {
  if (v === null || v === undefined || v === false) return '';
  if (v instanceof SafeHtml) return v.value;
  if (Array.isArray(v)) return v.map(render).join('');
  return escapeHtml(String(v));
}

export function html(strings: TemplateStringsArray, ...values: unknown[]): SafeHtml {
  let out = strings[0];
  for (let i = 0; i < values.length; i++) out += render(values[i]) + strings[i + 1];
  return new SafeHtml(out);
}

export const raw = (s: string): SafeHtml => new SafeHtml(s);

export function mount(el: Element, content: SafeHtml): void {
  el.innerHTML = content.value;
}

export function $<T extends Element = HTMLElement>(sel: string, root: ParentNode = document): T {
  const el = root.querySelector<T>(sel);
  if (!el) throw new Error(`Elemen ${sel} tidak ditemukan`);
  return el;
}

export function $$<T extends Element = HTMLElement>(sel: string, root: ParentNode = document): T[] {
  return Array.from(root.querySelectorAll<T>(sel));
}

/** Delegasi event: memanggil handler untuk elemen yang cocok dengan selector. */
export function on<K extends keyof HTMLElementEventMap>(
  root: Element,
  type: K,
  selector: string,
  handler: (ev: HTMLElementEventMap[K], target: HTMLElement) => void,
): void {
  root.addEventListener(type, (ev) => {
    const t = (ev.target as Element | null)?.closest<HTMLElement>(selector);
    if (t && root.contains(t)) handler(ev as HTMLElementEventMap[K], t);
  });
}
