import { TRANSPORTATION_PAY_PER_VISIT } from "@/components/ops/compensation-utils";
import type { EmployeeMonthlySummary } from "@/components/ops/employees/employee-summary-utils";

const pageWidth = 595;
const pageHeight = 842;
const margin = 44;
const currencyFormat = new Intl.NumberFormat("es-UY", {
  currency: "UYU",
  maximumFractionDigits: 2,
  style: "currency",
});

const cleanText = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\x20-\x7E]/g, "");

const escapePdfText = (value: string) =>
  cleanText(value).replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");

const money = (value: number | null) =>
  value === null ? "Sin tarifa" : cleanText(currencyFormat.format(value));

const transportationDetail = (visits: number, amount: number) =>
  `${visits} visitas x ${money(TRANSPORTATION_PAY_PER_VISIT)} = ${money(amount)}`;

const text = (x: number, y: number, size: number, value: string, bold = false, color = "0.09 0.15 0.11") =>
  `${color} rg BT /${bold ? "F2" : "F1"} ${size} Tf ${x} ${y} Td (${escapePdfText(value)}) Tj ET\n`;

const rect = (x: number, y: number, width: number, height: number, color: string) =>
  `${color} rg ${x} ${y} ${width} ${height} re f\n`;

const line = (x1: number, y1: number, x2: number, y2: number) =>
  `0.85 0.9 0.85 RG ${x1} ${y1} m ${x2} ${y2} l S\n`;

const formatDate = (value: Date | string) =>
  cleanText(new Intl.DateTimeFormat("es-UY", { dateStyle: "short" }).format(new Date(value)));

const formatTime = (value: Date | string | null) =>
  value
    ? cleanText(new Intl.DateTimeFormat("es-UY", { timeStyle: "short" }).format(new Date(value)))
    : "-";

const buildObjects = (pages: string[]) => {
  const pageStartId = 5;
  const contentStartId = pageStartId + pages.length;
  const pageIds = pages.map((_, index) => pageStartId + index);
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${pages.length} >>`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>",
  ];

  pages.forEach((_, index) => {
    objects.push(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${contentStartId + index} 0 R >>`
    );
  });
  pages.forEach((content) => {
    objects.push(`<< /Length ${content.length} >>\nstream\n${content}endstream`);
  });

  let pdf = "%PDF-1.4\n";
  const offsets = [0];

  objects.forEach((object, index) => {
    offsets.push(pdf.length);
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });

  const xref = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.slice(1).forEach((offset) => {
    pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
  });
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;

  return new TextEncoder().encode(pdf);
};

const buildSummaryPage = (employeeName: string, startDate: string, endDate: string, summary: EmployeeMonthlySummary) => {
  const maxHours = Math.max(...summary.jobRows.map((row) => row.hours), 0);
  let y = pageHeight - margin;
  let content = rect(0, pageHeight - 10, pageWidth, 10, "0.32 0.6 0.37");

  content += text(margin, y, 18, "Resumen mensual de empleada", true, "0.14 0.3 0.18");
  y -= 24;
  content += text(margin, y, 12, employeeName, true, "0.14 0.3 0.18");
  y -= 18;
  content += text(margin, y, 10, `Periodo: ${startDate} - ${endDate}`, false, "0.14 0.3 0.18");
  y -= 28;

  const totals = [
    ["Horas", `${summary.hours.toFixed(2)} hs`],
    ["Visitas", String(summary.visits)],
    ["Boleto", money(summary.transportationAmount)],
    ["Pago sugerido", money(summary.paymentAmount)],
    ["Saldo", money(summary.balance)],
    ["Tarifa", summary.hourlyRate === null ? "Sin tarifa" : `${money(summary.hourlyRate)} / h`],
  ];

  totals.forEach(([label, value], index) => {
    const x = margin + (index % 2) * 260;
    if (index % 2 === 0 && index > 0) y -= 34;
    content += rect(x, y - 16, 235, 26, "0.96 0.98 0.96");
    content += text(x + 8, y, 8, label.toUpperCase(), false, "0.38 0.45 0.39");
    content += text(x + 8, y - 12, 11, value, true);
  });
  y -= 56;

  content += text(margin, y, 13, "Horas por trabajo", true);
  y -= 18;
  content += line(margin, y, pageWidth - margin, y);
  y -= 18;

  if (!summary.jobRows.length) {
    return content + text(margin, y, 10, "No hay visitas realizadas para este periodo.", false, "0.38 0.45 0.39");
  }

  summary.jobRows.slice(0, 14).forEach((row) => {
    const barWidth = maxHours > 0 ? Math.max((row.hours / maxHours) * 150, 6) : 6;
    content += text(margin, y, 10, row.jobName, true, "0.14 0.3 0.18");
    content += text(270, y, 9, `${row.hours.toFixed(2)} hs`, false, "0.14 0.3 0.18");
    content += text(340, y, 9, `${row.visits} visitas`, false, "0.14 0.3 0.18");
    content += text(460, y, 9, money(row.paymentAmount), false, "0.14 0.3 0.18");
    content += rect(margin, y - 16, 150, 7, "0.91 0.96 0.92");
    content += rect(margin, y - 16, barWidth, 7, "0.32 0.6 0.37");
    y -= 34;
  });

  content += text(margin, y, 9, `Boleto: ${transportationDetail(summary.visits, summary.transportationAmount)}`, false, "0.38 0.45 0.39");
  y -= 18;

  return summary.jobRows.length > 14
    ? content + text(margin, y, 9, `Y ${summary.jobRows.length - 14} trabajos mas en el CSV.`, false, "0.38 0.45 0.39")
    : content;
};

const buildVisitPages = (summary: EmployeeMonthlySummary) => {
  const pages: string[] = [];
  let y = pageHeight - margin;
  let content = "";
  let currentJobId = "";

  const startPage = () => {
    if (content) pages.push(content);
    y = pageHeight - margin;
    content = rect(0, pageHeight - 10, pageWidth, 10, "0.32 0.6 0.37");
    content += text(margin, y, 16, "Visitas por trabajo", true, "0.14 0.3 0.18");
    y -= 26;
  };
  const ensureSpace = (height = 22) => {
    if (!content || y < margin + height) startPage();
  };

  startPage();
  if (!summary.visitRows.length) {
    content += text(margin, y, 10, "No hay visitas para listar en este periodo.", false, "0.38 0.45 0.39");
    return [...pages, content];
  }

  summary.visitRows.forEach((visit) => {
    const isNewJob = visit.jobId !== currentJobId;
    ensureSpace(isNewJob ? 44 : 24);
    if (isNewJob) {
      currentJobId = visit.jobId;
      content += text(margin, y, 12, visit.jobName, true, "0.14 0.3 0.18");
      y -= 14;
      content += line(margin, y, pageWidth - margin, y);
      y -= 16;
    }
    content += text(margin, y, 9, formatDate(visit.scheduledStartAt), true);
    content += text(120, y, 9, `${formatTime(visit.actualStartAt)} - ${formatTime(visit.actualEndAt)}`);
    content += text(245, y, 9, `${visit.hours.toFixed(2)} hs`);
    content += text(330, y, 9, visit.notes || "Sin notas", false, "0.38 0.45 0.39");
    y -= 22;
  });

  return [...pages, content];
};

export const buildEmployeeSummaryPdf = (employeeName: string, startDate: string, endDate: string, summary: EmployeeMonthlySummary) => {
  return buildObjects([
    buildSummaryPage(employeeName, startDate, endDate, summary),
    ...buildVisitPages(summary),
  ]);
};
