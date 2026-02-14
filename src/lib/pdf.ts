// Utility to export HTML to PDF using html2pdf.js
// You need to install html2pdf.js: npm install html2pdf.js
import * as html2pdf from "html2pdf.js";

export function exportElementToPDF(element: HTMLElement, filename = "receipt.pdf", title = "Custom Split Bill") {
  // Clone the element to avoid mutating the DOM
  const clone = element.cloneNode(true) as HTMLElement;

  // Create a wrapper for the whole PDF content
  const wrapper = document.createElement("div");
  wrapper.style.fontFamily = "Poppins, Arial, sans-serif";
  wrapper.style.fontSize = "14px";
  wrapper.style.color = "#222";
  wrapper.style.background = "#fff";
  wrapper.style.padding = "24px";
  wrapper.style.width = "100%";
  wrapper.style.minHeight = "900px";
  wrapper.style.display = "flex";
  wrapper.style.flexDirection = "column";

  // Header: 'Receipt'
  const header = document.createElement("div");
  header.textContent = "Receipt";
  header.style.textAlign = "center";
  header.style.fontSize = "1.3rem";
  header.style.fontWeight = "bold";
  header.style.marginBottom = "8px";
  wrapper.appendChild(header);

  // Title: [Judul]
  const titleEl = document.createElement("div");
  titleEl.textContent = title;
  titleEl.style.textAlign = "center";
  titleEl.style.fontSize = "1.1rem";
  titleEl.style.fontWeight = "bold";
  titleEl.style.marginBottom = "12px";
  wrapper.appendChild(titleEl);

  // Separator
  const sep1 = document.createElement("hr");
  sep1.style.margin = "12px 0 24px 0";
  wrapper.appendChild(sep1);

  // Content (flex: 1, push sep/footer to bottom)
  const content = document.createElement("div");
  content.style.flexGrow = "1";
  content.appendChild(clone);
  wrapper.appendChild(content);

  // Separator before footer (auto push to bottom)
  const sep2 = document.createElement("hr");
  sep2.style.margin = "60px 0 0 0"; // Large space above
  sep2.style.marginTop = "auto";
  wrapper.appendChild(sep2);

  // Footer (always at the very bottom, with Nexteam as a link)
  const footer = document.createElement("div");
  footer.style.textAlign = "center";
  footer.style.fontSize = "0.9rem";
  footer.style.color = "#888";
  footer.style.marginTop = "8px";
  footer.style.paddingBottom = "8px";
  footer.innerHTML = '© 2026 Patungan by <a href="https://www.nofileexistshere.my.id/" style="color:#3b82f6;text-decoration:underline;" target="_blank">Nexteam</a>. All rights reserved.';
  wrapper.appendChild(footer);

  const opt = {
    margin: 0.5,
    filename: filename,
    image: { type: "jpeg", quality: 0.98 },
    html2canvas: { scale: 2 },
    jsPDF: { unit: "in", format: "a4", orientation: "portrait" },
  };
  // Vite/ESM: html2pdf.default is the function, fallback to html2pdf
  const fn = html2pdf && (html2pdf as any).default ? (html2pdf as any).default : html2pdf;
  if (typeof fn === "function") {
    fn().set(opt).from(wrapper).save();
  } else {
    alert("html2pdf.js is not loaded!");
  }
}
