import { NextRequest, NextResponse } from "next/server";
import mammoth from "mammoth";
import { extractText, getDocumentProxy } from "unpdf";

export const dynamic = "force-dynamic";

/** Extract all text from a PDF buffer using unpdf, with a 30 s timeout */
async function extractPdfText(
  buffer: Buffer
): Promise<{ text: string; pages: number; pageTexts: string[] }> {
  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error("PDF parsing timed out after 30 s")), 30_000)
  );

  const parse = (async () => {
    const pdf = await getDocumentProxy(new Uint8Array(buffer));
    const { text: raw, totalPages } = await extractText(pdf, { mergePages: false });
    const pageTexts = (Array.isArray(raw) ? raw : [String(raw)]).map((t) => t.trim());
    const text = pageTexts.join("\n\n").trim();
    return { text, pages: totalPages, pageTexts };
  })();

  return Promise.race([parse, timeout]);
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const name = file.name.toLowerCase();
    const buffer = Buffer.from(await file.arrayBuffer());

    /* ── DOCX ─────────────────────────────────────────────── */
    if (name.endsWith(".docx")) {
      const result = await mammoth.extractRawText({ buffer });
      const text = result.value.trim();
      if (!text) {
        return NextResponse.json(
          { error: "Could not extract text from this DOCX file." },
          { status: 422 }
        );
      }
      return NextResponse.json({ text });
    }

    /* ── PDF ──────────────────────────────────────────────── */
    if (name.endsWith(".pdf")) {
      const { text, pages, pageTexts } = await extractPdfText(buffer);
      if (!text) {
        return NextResponse.json(
          { error: "Could not extract text from this PDF. It may be image-only or encrypted." },
          { status: 422 }
        );
      }
      return NextResponse.json({ text, pages, pageTexts });
    }

    return NextResponse.json(
      { error: "Unsupported file type. Send a .pdf or .docx file." },
      { status: 415 }
    );
  } catch (err) {
    console.error("[extract] Error:", err);
    return NextResponse.json(
      { error: "Failed to extract text from file." },
      { status: 500 }
    );
  }
}
