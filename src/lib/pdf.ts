// Thermal receipt-style PDF export for Patungan
import * as html2pdf from "html2pdf.js";

export interface ReceiptPerson {
  name: string;
  items: { name: string; price: number }[];
  subtotal: number;
  serviceCharge: number;
  tax: number;
  total: number;
}

const rp = (n: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(n);

function dashed(): HTMLElement {
  const el = document.createElement("div");
  el.style.cssText = "border-top:1px dashed #888;margin:5px 0;";
  return el;
}

function solid(): HTMLElement {
  const el = document.createElement("div");
  el.style.cssText = "border-top:2px solid #111;margin:5px 0;";
  return el;
}

function row(
  left: string,
  right: string,
  opts: { bold?: boolean; indent?: boolean; size?: number } = {}
): HTMLElement {
  const el = document.createElement("div");
  el.style.cssText = `
    display:flex;justify-content:space-between;align-items:baseline;
    gap:4px;font-size:${opts.size ?? 10}px;
    font-weight:${opts.bold ? "700" : "400"};line-height:1.7;
  `;
  const l = document.createElement("span");
  l.textContent = (opts.indent ? "  " : "") + left;
  l.style.cssText = "flex:1;word-break:break-word;";
  const r = document.createElement("span");
  r.textContent = right;
  r.style.cssText = "white-space:nowrap;";
  el.appendChild(l);
  el.appendChild(r);
  return el;
}

function center(text: string, opts: { size?: number; bold?: boolean; mt?: number; mb?: number } = {}): HTMLElement {
  const el = document.createElement("div");
  el.innerHTML = text;
  el.style.cssText = `
    text-align:center;font-size:${opts.size ?? 10}px;
    font-weight:${opts.bold ? "700" : "400"};
    ${opts.mt ? `margin-top:${opts.mt}px;` : ""}
    ${opts.mb ? `margin-bottom:${opts.mb}px;` : ""}
    line-height:1.5;
  `;
  return el;
}

export function exportElementToPDF(
  _element: HTMLElement,
  filename = "patungan-receipt.pdf",
  title = "Custom Split Bill",
  persons: ReceiptPerson[] = []
) {
  const now = new Date();
  const dateStr = now.toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" });
  const timeStr = now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
  const grandTotal = persons.reduce((s, p) => s + p.total, 0);

  // ── Struk container ──────────────────────────────────────────────────────────
  const struk = document.createElement("div");
  struk.style.cssText = `
    font-family:'Courier New',Courier,monospace;font-size:10px;
    color:#111;background:#fff;width:272px;
    margin:0 auto;padding:14px 10px 20px;box-sizing:border-box;
  `;

  // ─ Header ─
  struk.appendChild(center("PATUNGAN", { size: 20, bold: true, mb: 2 }));
  struk.appendChild(center("by Nexteam", { size: 9, mb: 4 }));
  struk.appendChild(solid());
  struk.appendChild(center(title.toUpperCase(), { size: 11, bold: true, mt: 4, mb: 2 }));
  struk.appendChild(center(`${dateStr}  ${timeStr}`, { size: 9, mb: 4 }));
  struk.appendChild(solid());

  // ─ Per-person sections ─
  persons.forEach((person, idx) => {
    const nameEl = document.createElement("div");
    nameEl.textContent = `◆ ${person.name.toUpperCase()}`;
    nameEl.style.cssText = "font-size:11px;font-weight:700;margin:8px 0 3px;";
    struk.appendChild(nameEl);

    if (person.items.length === 0) {
      const empty = document.createElement("div");
      empty.textContent = "  (tidak ada item)";
      empty.style.cssText = "font-size:9px;color:#888;";
      struk.appendChild(empty);
    } else {
      person.items.forEach((item) => struk.appendChild(row(item.name, rp(item.price), { indent: true })));
    }

    struk.appendChild(dashed());
    struk.appendChild(row("Subtotal", rp(person.subtotal), { indent: true }));
    if (person.serviceCharge > 0) struk.appendChild(row("Service", rp(person.serviceCharge), { indent: true }));
    if (person.tax > 0) struk.appendChild(row("Pajak", rp(person.tax), { indent: true }));
    struk.appendChild(dashed());
    struk.appendChild(row("TOTAL", rp(person.total), { bold: true }));

    if (idx < persons.length - 1) {
      const gap = document.createElement("div");
      gap.style.height = "6px";
      struk.appendChild(gap);
    }
  });

  // ─ Grand total ─
  struk.appendChild(solid());
  struk.appendChild(row("GRAND TOTAL", rp(grandTotal), { bold: true, size: 12 }));
  struk.appendChild(solid());

  // ─ Footer ─
  const footer = center(
    `Terima kasih sudah pakai Patungan!<br><br>patungan.vercel.app<br><br>================================`,
    { size: 9, mt: 10 }
  );
  footer.style.color = "#555";
  struk.appendChild(footer);

  // ── PDF options: narrow roll width (72mm ≈ 2.83in) ─────────────────────────
  const opt = {
    margin: [0.1, 0.1],
    filename,
    image: { type: "jpeg", quality: 0.98 },
    html2canvas: { scale: 3, useCORS: true, backgroundColor: "#ffffff" },
    jsPDF: { unit: "in", format: [3.15, 14], orientation: "portrait" },
  };

  const fn = html2pdf && (html2pdf as any).default ? (html2pdf as any).default : html2pdf;
  if (typeof fn === "function") {
    fn().set(opt).from(struk).save();
  } else {
    alert("html2pdf.js is not loaded!");
  }
}
