import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import type { Certificate } from "./certificate-workflow";
import logoAsset from "@/assets/ehf-logo-transparent.png.asset.json";
export function downloadBlob(bytes: BlobPart, type: string, name: string) {
  const url = URL.createObjectURL(new Blob([bytes], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}
export async function certificatePdf(c: Certificate): Promise<Uint8Array> {
  const t = c.template;
  const doc =
    t.mime === "application/pdf" && t.bytes
      ? await PDFDocument.load(t.bytes)
      : await PDFDocument.create();
  const page = doc.getPages()[0] ?? doc.addPage([842, 595]);
  const { width: w, height: h } = page.getSize();
  if (t.bytes && t.mime?.startsWith("image/")) {
    const img = t.mime === "image/png" ? await doc.embedPng(t.bytes) : await doc.embedJpg(t.bytes);
    page.drawImage(img, { x: 0, y: 0, width: w, height: h });
  }
  const regular = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const text = (s: string, y: number, size: number, strong = false) => {
    const font = strong ? bold : regular;
    const safe = s.replace(/[^\x20-\x7e]/g, "?");
    const fit = Math.min(size, (w - 100) / Math.max(font.widthOfTextAtSize(safe, 1), 1));
    page.drawText(safe, {
      x: (w - font.widthOfTextAtSize(safe, fit)) / 2,
      y: (y * h) / 100,
      size: fit,
      font,
      color: rgb(0.08, 0.19, 0.3),
    });
  };
  if (!t.bytes) {
    page.drawRectangle({
      x: 20,
      y: 20,
      width: w - 40,
      height: h - 40,
      borderColor: rgb(0.1, 0.4, 0.65),
      borderWidth: 2,
    });
    text("Ethnic Health Forum", 78, 24, true);
    text(c.title, 68, 30, true);
  }
  if (t.logo) {
    const response = await fetch(logoAsset.url);
    if (!response.ok) throw new Error("Organisation logo could not be loaded");
    const image = await doc.embedPng(await response.arrayBuffer());
    const dims = image.scaleToFit(140, 52);
    page.drawImage(image, {
      x: (w - dims.width) / 2,
      y: h * 0.85,
      width: dims.width,
      height: dims.height,
    });
  }
  text(c.name, t.nameY, 32, true);
  text(`Volunteer ID: ${c.volunteerId}`, t.nameY - 6, 12);
  text(`${c.hours.toFixed(2)} approved volunteer hours`, t.detailY + 6, 18);
  text(c.final ? `Volunteering period: ${c.startDate} to ${c.completionDate}` : c.project, t.detailY, 18);
  text(
    `Completion: ${c.completionDate || "Not required"} | Issue: ${c.issuedAt.slice(0, 10) || "Pending issue"}`,
    t.detailY - 6,
    11,
  );
  if (t.bytes) {
    text("Ethnic Health Forum", 78, 20, true);
    text(c.title, 68, 26, true);
  }
  if (t.signatureBytes) {
    const image =
      t.signatureMime === "image/png"
        ? await doc.embedPng(t.signatureBytes)
        : await doc.embedJpg(t.signatureBytes);
    const d = image.scaleToFit(120, 40);
    page.drawImage(image, { x: (w - d.width) / 2, y: h * 0.19, width: d.width, height: d.height });
  }
  if (t.signatory)
    text(`${t.signatory}${t.signatoryTitle ? " — " + t.signatoryTitle : ""}`, 17, 13);
  text(c.number, 10, 11);
  text("DEMONSTRATION ONLY — NOT AN OFFICIAL CERTIFICATE", 5, 10, true);
  return doc.save();
}
export async function reportPdf(title: string, headers: string[], rows: (string | number)[][]) {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  let page = doc.addPage([842, 595]);
  let y = 555;
  const line = (s: string) => {
    if (y < 35) {
      page = doc.addPage([842, 595]);
      y = 555;
    }
    page.drawText(s.replace(/[^\x20-\x7e]/g, "?").slice(0, 150), { x: 30, y, size: 9, font });
    y -= 18;
  };
  line(`EHF DEMONSTRATION ONLY | ${title}`);
  line(headers.join(" | "));
  rows.forEach((r) => line(r.join(" | ")));
  return doc.save();
}
export async function spreadsheet(headers: string[], rows: (string | number)[][]) {
  const { Workbook } = await import("exceljs");
  const book = new Workbook();
  const sheet = book.addWorksheet("Demo attendance");
  sheet.addRow(headers);
  rows.forEach((r) => sheet.addRow(r));
  sheet.columns.forEach((c) => {
    c.width = 25;
  });
  return book.xlsx.writeBuffer();
}
export function csv(headers: string[], rows: (string | number)[][]) {
  const cell = (x: string | number) =>
    `"${String(x)
      .replace(/"/g, '""')
      .replace(/^[=+@-]/, "'")}"`;
  return [headers, ...rows].map((r) => r.map(cell).join(",")).join("\r\n");
}
