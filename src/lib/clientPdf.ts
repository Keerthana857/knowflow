import { DocumentExcerpt, DocumentSource } from '../types';

/**
 * Extracts text excerpts directly in the browser using pdfjs-dist.
 * - Handles 100MB+ PDFs locally without uploading huge binaries to Vercel.
 * - Uses ZERO AI credits during upload (just saves cleanly into Library).
 * - Keeps stored excerpts compact (< 320 KB total) so Cloud Firestore stays well below 1 MB.
 */
export async function parsePdfClientSide(
  file: File,
  folderId: string,
  onProgress?: (pct: number, pageLabel: string) => void
): Promise<DocumentSource> {
  const cleanTitle = file.name.replace(/\.pdf$/i, '').slice(0, 200);
  const fileSizeStr =
    file.size >= 1024 * 1024
      ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
      : `${Math.max(1, Math.round(file.size / 1024))} KB`;

  let pageCount = 1;
  const excerpts: DocumentExcerpt[] = [];
  let abstractText = '';

  try {
    const pdfjs = await import('pdfjs-dist');
    pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjs.getDocument({ data: new Uint8Array(arrayBuffer) });
    const pdf = await loadingTask.promise;
    pageCount = pdf.numPages || 1;

    // Sample up to 120 pages evenly if the PDF is massive, keeping total stored text compact
    const maxPagesToScan = Math.min(pageCount, 120);
    const step = pageCount > 120 ? pageCount / 120 : 1;
    let totalChars = 0;
    const maxTotalChars = 220_000; // ~220 KB safe under Firestore 1MB limit

    for (let i = 0; i < maxPagesToScan; i++) {
      const pageNum = Math.min(pageCount, Math.floor(i * step) + 1);
      onProgress?.(
        Math.round(((i + 1) / maxPagesToScan) * 100),
        `Reading page ${pageNum} of ${pageCount}`
      );

      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => (typeof item.str === 'string' ? item.str : ''))
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim();

      if (pageText.length > 25 && totalChars < maxTotalChars) {
        const snippet = pageText.slice(0, 1800);
        if (!abstractText && snippet.length > 40) {
          abstractText = snippet.slice(0, 320);
        }

        const firstSentence = snippet.split(/[.!?]/)[0]?.trim() || `Page ${pageNum}`;
        const heading =
          firstSentence.length > 52 ? `${firstSentence.slice(0, 49)}...` : firstSentence;

        excerpts.push({
          id: `ex-${Date.now()}-${pageNum}`,
          page: pageNum,
          heading,
          text: snippet
        });
        totalChars += snippet.length;
      }
    }
  } catch (err) {
    console.warn('Client PDF text parse fallback:', err);
  }

  if (excerpts.length === 0) {
    excerpts.push({
      id: `ex-${Date.now()}-1`,
      page: 1,
      heading: cleanTitle,
      text: `Saved PDF file "${file.name}" (${pageCount} pages, ${fileSizeStr}). Ask questions or paste key excerpts to explore it.`
    });
  }

  return {
    id: `doc-pdf-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    folderId,
    sourceType: 'pdf',
    title: cleanTitle,
    authors: 'Saved PDF',
    year: new Date().getFullYear(),
    abstract:
      abstractText ||
      `Saved PDF "${cleanTitle}" (${pageCount} pages, ${fileSizeStr}).`,
    pageCount,
    fileSize: fileSizeStr,
    uploadDate: new Date().toISOString().split('T')[0],
    keyStance:
      (abstractText.split(/[.!?]/)[0] || cleanTitle).slice(0, 180),
    excerpts
  };
}
