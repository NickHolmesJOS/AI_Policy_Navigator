/**
 * Client-side file text extraction utility.
 *
 * - .txt / .md  → plain FileReader (instant, no deps)
 * - .pdf        → POST to /api/extract (pdf2json, server-side)
 * - .docx       → POST to /api/extract (mammoth, server-side)
 */

export type ExtractionResult = {
  text: string;
  pages?: number;
  /** Per-page text strings (PDF only) */
  pageContents?: string[];
};

/** Returns true when the file extension is something we can handle */
export function isSupportedFile(file: File): boolean {
  const name = file.name.toLowerCase();
  return [".pdf", ".docx", ".txt", ".md", ".text"].some((ext) => name.endsWith(ext));
}

export async function extractFileText(file: File): Promise<ExtractionResult> {
  const name = file.name.toLowerCase();

  /* ── Plain text / markdown ─────────────────────────────── */
  if (name.endsWith(".txt") || name.endsWith(".md") || name.endsWith(".text")) {
    const text = await file.text();
    return { text };
  }

  /* ── PDF & DOCX — server-side via /api/extract ────────── */
  if (name.endsWith(".pdf") || name.endsWith(".docx")) {
    const fd = new FormData();
    fd.append("file", file);

    const res = await fetch("/api/extract", { method: "POST", body: fd });
    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error ?? "Could not extract text from file");
    }
    return { text: data.text, pages: data.pages, pageContents: data.pageTexts };
  }

  throw new Error("Unsupported file type");
}
