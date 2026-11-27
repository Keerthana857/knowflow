import pdfParse from 'pdf-parse';
import { DocumentExcerpt } from '../types';

export interface ExtractedSection {
  title: string;
  content: string;
  pageEstimate: number;
}

export interface ParsedPdfResult {
  title: string;
  authors: string;
  abstract: string;
  textSnippet: string;
  pageCount: number;
  sections: ExtractedSection[];
  excerpts: DocumentExcerpt[];
}

export async function parsePdfBuffer(buffer: Buffer, originalFilename: string): Promise<ParsedPdfResult> {
  try {
    const data = await pdfParse(buffer);
    const text = (data.text || '').replace(/\r/g, '');
    const pageCount = data.numpages || 1;

    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
    const candidateTitle =
      lines.find(l => l.length > 4 && l.length < 120) || originalFilename.replace(/\.pdf$/i, '');
    const cleanTitle = candidateTitle.length > 100 ? candidateTitle.substring(0, 97) + '...' : candidateTitle;

    // Detect Abstract or meaningful opening lines
    let abstract = '';
    const abstractMatch = text.match(/abstract[:\s\n]+([\s\S]{80,750}?)(?:introduction|1\.|background|\n\n\n)/i);
    if (abstractMatch && abstractMatch[1]) {
      abstract = abstractMatch[1].replace(/\s+/g, ' ').trim();
    } else {
      abstract = lines.slice(1, 8).join(' ').replace(/\s+/g, ' ').substring(0, 420);
      if (abstract.length >= 415) abstract += '...';
    }

    // Split text into structured excerpts with estimated page numbers
    const sections: ExtractedSection[] = [];
    const excerpts: DocumentExcerpt[] = [];

    const chunkSize = 1100;
    const cleanBody = text.replace(/\s+/g, ' ').trim();
    const totalChunks = Math.min(10, Math.max(1, Math.ceil(cleanBody.length / chunkSize)));

    for (let i = 0; i < totalChunks; i++) {
      const start = i * chunkSize;
      const snippet = cleanBody.substring(start, start + chunkSize).trim();
      if (snippet.length < 40) continue;

      const pageEstimate = Math.max(1, Math.min(pageCount, Math.round(((i + 0.5) / totalChunks) * pageCount)));
      // Try to pull a meaningful heading phrase from first few words
      const firstSentence = snippet.split(/[.!?]/)[0]?.trim() || `Part ${i + 1}`;
      const heading =
        firstSentence.length > 48 ? firstSentence.slice(0, 45).trim() + '...' : firstSentence;

      sections.push({
        title: `Part ${i + 1}: ${heading}`,
        content: snippet,
        pageEstimate
      });

      excerpts.push({
        id: `ex-${Date.now()}-${i + 1}`,
        page: pageEstimate,
        heading,
        text: snippet
      });
    }

    if (sections.length === 0) {
      sections.push({
        title: 'Overview',
        content: `Document: ${cleanTitle}`,
        pageEstimate: 1
      });
      excerpts.push({
        id: `ex-${Date.now()}-1`,
        page: 1,
        heading: 'Overview',
        text: `Document: ${cleanTitle}`
      });
    }

    return {
      title: cleanTitle,
      authors: 'Uploaded Document',
      abstract: abstract || `Extracted study material from ${cleanTitle}.`,
      textSnippet: cleanBody.substring(0, 1200),
      pageCount,
      sections,
      excerpts
    };
  } catch (error) {
    console.error('Error parsing PDF buffer:', error);
    const fallbackTitle = originalFilename.replace(/\.pdf$/i, '');
    return {
      title: fallbackTitle,
      authors: 'Uploaded Document',
      abstract: `Uploaded PDF file: ${fallbackTitle}.`,
      textSnippet: '',
      pageCount: 1,
      sections: [
        {
          title: 'Overview',
          content: `Uploaded file: ${originalFilename}`,
          pageEstimate: 1
        }
      ],
      excerpts: [
        {
          id: `ex-${Date.now()}-1`,
          page: 1,
          heading: 'Overview',
          text: `Uploaded file: ${originalFilename}`
        }
      ]
    };
  }
}
