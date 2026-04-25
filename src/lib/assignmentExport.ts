// Generate DOCX and PDF from the structured assignment.
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  PageBreak,
} from "docx";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";

export type AssignmentContent = {
  title: string;
  subtitle?: string;
  topic?: string;
  introduction: string;
  sections: {
    heading: string;
    paragraphs: string[];
    subsections?: { heading: string; paragraphs: string[] }[];
  }[];
  conclusion: string;
  references?: string[];
};

export type ExportOptions = {
  includeTitlePage: boolean;
  includeReferences: boolean;
  handwritten: boolean;
  handwritingStyle?: "neat" | "cursive" | "rough";
  authorName?: string;
};

const HW_FONT_MAP: Record<string, string> = {
  neat: "Kalam",
  cursive: "Dancing Script",
  rough: "Caveat",
};

function fontFor(opts: ExportOptions) {
  if (!opts.handwritten) return "Calibri";
  return HW_FONT_MAP[opts.handwritingStyle || "neat"] || "Kalam";
}

// ---------- DOCX ----------
export async function generateDocx(content: AssignmentContent, opts: ExportOptions): Promise<Blob> {
  const font = fontFor(opts);
  const baseSize = opts.handwritten ? 32 : 24; // half-points

  const para = (text: string, extra: Partial<ConstructorParameters<typeof Paragraph>[0]> = {}) =>
    new Paragraph({
      spacing: { line: opts.handwritten ? 480 : 360, after: 200 },
      ...extra,
      children: [new TextRun({ text, font, size: baseSize })],
    });

  const heading = (text: string, level: (typeof HeadingLevel)[keyof typeof HeadingLevel]) =>
    new Paragraph({
      heading: level,
      spacing: { before: 320, after: 160 },
      children: [
        new TextRun({
          text,
          font,
          bold: true,
          size: level === HeadingLevel.HEADING_1 ? 40 : level === HeadingLevel.HEADING_2 ? 32 : 28,
        }),
      ],
    });

  const children: Paragraph[] = [];

  if (opts.includeTitlePage) {
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 2400, after: 400 },
        children: [new TextRun({ text: content.title, font, bold: true, size: 56 })],
      }),
    );
    if (content.subtitle) {
      children.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 400 },
          children: [new TextRun({ text: content.subtitle, font, size: 32, italics: true })],
        }),
      );
    }
    if (opts.authorName) {
      children.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 800 },
          children: [new TextRun({ text: `By ${opts.authorName}`, font, size: 28 })],
        }),
      );
    }
    children.push(new Paragraph({ children: [new PageBreak()] }));
  }

  children.push(heading(content.title, HeadingLevel.HEADING_1));
  children.push(heading("Introduction", HeadingLevel.HEADING_2));
  for (const p of content.introduction.split(/\n\n+/)) if (p.trim()) children.push(para(p.trim()));

  for (const s of content.sections) {
    children.push(heading(s.heading, HeadingLevel.HEADING_2));
    for (const p of s.paragraphs) if (p.trim()) children.push(para(p.trim()));
    for (const sub of s.subsections || []) {
      children.push(heading(sub.heading, HeadingLevel.HEADING_3));
      for (const p of sub.paragraphs) if (p.trim()) children.push(para(p.trim()));
    }
  }

  children.push(heading("Conclusion", HeadingLevel.HEADING_2));
  for (const p of content.conclusion.split(/\n\n+/)) if (p.trim()) children.push(para(p.trim()));

  if (opts.includeReferences && content.references?.length) {
    children.push(heading("References", HeadingLevel.HEADING_2));
    for (const r of content.references) children.push(para(r));
  }

  const doc = new Document({
    styles: {
      default: { document: { run: { font, size: baseSize } } },
    },
    sections: [
      {
        properties: {
          page: {
            size: { width: 12240, height: 15840 },
            margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
          },
        },
        children,
      },
    ],
  });

  return await Packer.toBlob(doc);
}

export async function downloadDocx(content: AssignmentContent, opts: ExportOptions, filename: string) {
  const blob = await generateDocx(content, opts);
  saveAs(blob, filename.endsWith(".docx") ? filename : `${filename}.docx`);
}

// ---------- PDF ----------
// Uses jsPDF directly (text-based, selectable). Handwriting fonts only render in DOCX/preview;
// jsPDF's default font is used for guaranteed PDF compatibility.
export function generatePdf(content: AssignmentContent, opts: ExportOptions): Blob {
  const pdf = new jsPDF({ unit: "pt", format: "letter" });
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const margin = 72;
  const maxW = pageW - margin * 2;
  let y = margin;

  const ensureSpace = (h: number) => {
    if (y + h > pageH - margin) {
      pdf.addPage();
      y = margin;
    }
  };

  const writeText = (text: string, size: number, bold = false, align: "left" | "center" = "left") => {
    pdf.setFont("times", bold ? "bold" : "normal");
    pdf.setFontSize(size);
    const lines = pdf.splitTextToSize(text, maxW);
    for (const line of lines) {
      ensureSpace(size * 1.4);
      pdf.text(line, align === "center" ? pageW / 2 : margin, y, { align });
      y += size * 1.4;
    }
  };

  if (opts.includeTitlePage) {
    y = pageH / 3;
    writeText(content.title, 26, true, "center");
    y += 12;
    if (content.subtitle) writeText(content.subtitle, 16, false, "center");
    if (opts.authorName) {
      y += 40;
      writeText(`By ${opts.authorName}`, 14, false, "center");
    }
    pdf.addPage();
    y = margin;
  }

  writeText(content.title, 22, true);
  y += 6;
  writeText("Introduction", 16, true);
  for (const p of content.introduction.split(/\n\n+/)) if (p.trim()) {
    writeText(p.trim(), 12);
    y += 4;
  }

  for (const s of content.sections) {
    y += 6;
    writeText(s.heading, 16, true);
    for (const p of s.paragraphs) if (p.trim()) {
      writeText(p.trim(), 12);
      y += 4;
    }
    for (const sub of s.subsections || []) {
      y += 4;
      writeText(sub.heading, 14, true);
      for (const p of sub.paragraphs) if (p.trim()) {
        writeText(p.trim(), 12);
        y += 4;
      }
    }
  }

  y += 6;
  writeText("Conclusion", 16, true);
  for (const p of content.conclusion.split(/\n\n+/)) if (p.trim()) {
    writeText(p.trim(), 12);
    y += 4;
  }

  if (opts.includeReferences && content.references?.length) {
    y += 8;
    writeText("References", 16, true);
    for (const r of content.references) {
      writeText(`• ${r}`, 11);
      y += 2;
    }
  }

  return pdf.output("blob");
}

export function downloadPdf(content: AssignmentContent, opts: ExportOptions, filename: string) {
  const blob = generatePdf(content, opts);
  saveAs(blob, filename.endsWith(".pdf") ? filename : `${filename}.pdf`);
}
