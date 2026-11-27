import { NextResponse } from 'next/server';
import { parsePdfBuffer } from '@/lib/pdfExtractor';
import { extractConceptsAndClaimsFromPdf } from '@/lib/ai';
import { DocumentSource, DocumentExcerpt } from '@/types';

export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get('content-type') || '';
    const newDocuments: DocumentSource[] = [];
    const allNewConcepts: any[] = [];
    const allNewEdges: any[] = [];
    const allNewClaims: any[] = [];

    if (contentType.includes('application/json')) {
      const body = await request.json();
      const title = (body.title || 'Pasted Notes').trim();
      const text = (body.text || '').trim();
      const folderId = body.folderId || 'folder-default';

      if (!text || text.length < 15) {
        return NextResponse.json(
          { success: false, error: 'Please paste at least a couple of sentences of study notes.' },
          { status: 400 }
        );
      }

      const cleanText = text.replace(/\s+/g, ' ').trim();
      const chunkSize = 1000;
      const excerpts: DocumentExcerpt[] = [];
      const sections: { title: string; content: string; pageEstimate: number }[] = [];

      const count = Math.min(8, Math.max(1, Math.ceil(cleanText.length / chunkSize)));
      for (let i = 0; i < count; i++) {
        const snippet = cleanText.slice(i * chunkSize, (i + 1) * chunkSize).trim();
        const heading = snippet.split(/[.!?]/)[0]?.slice(0, 48) || `Part ${i + 1}`;
        excerpts.push({
          id: `ex-paste-${Date.now()}-${i + 1}`,
          page: i + 1,
          heading,
          text: snippet
        });
        sections.push({
          title: heading,
          content: snippet,
          pageEstimate: i + 1
        });
      }

      const docId = `doc-paste-${Date.now()}`;
      const docSource: DocumentSource = {
        id: docId,
        folderId,
        sourceType: 'pasted',
        title,
        authors: 'Pasted Notes',
        year: new Date().getFullYear(),
        abstract: cleanText.slice(0, 320),
        pageCount: count,
        fileSize: `${Math.max(1, Math.round(cleanText.length / 1024))} KB`,
        uploadDate: new Date().toISOString().split('T')[0],
        keyStance: cleanText.split(/[.!?]/)[0]?.slice(0, 140) || title,
        excerpts
      };

      const extraction = await extractConceptsAndClaimsFromPdf(
        docId,
        {
          title,
          authors: 'Pasted Notes',
          abstract: docSource.abstract,
          textSnippet: cleanText.slice(0, 1000),
          pageCount: count,
          sections,
          excerpts
        },
        []
      );

      newDocuments.push(docSource);
      allNewConcepts.push(...extraction.concepts);
      allNewEdges.push(...extraction.edges);
      allNewClaims.push(...extraction.claims);
    } else {
      const formData = await request.formData();
      const files = formData.getAll('files') as File[];
      const targetFolderId = (formData.get('folderId') as string) || 'folder-default';

      if (!files || files.length === 0) {
        return NextResponse.json({ success: false, error: 'No PDF files provided' }, { status: 400 });
      }

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
          continue;
        }

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const parsedPdf = await parsePdfBuffer(buffer, file.name);
        const docId = `doc-pdf-${Date.now()}-${i + 1}`;

        const docSource: DocumentSource = {
          id: docId,
          folderId: targetFolderId,
          sourceType: 'pdf',
          title: parsedPdf.title || file.name.replace(/\.pdf$/i, ''),
          authors: parsedPdf.authors || 'Uploaded PDF',
          year: new Date().getFullYear(),
          abstract: parsedPdf.abstract || 'Uploaded study PDF.',
          pageCount: parsedPdf.pageCount || 1,
          fileSize: `${Math.max(0.1, file.size / (1024 * 1024)).toFixed(1)} MB`,
          uploadDate: new Date().toISOString().split('T')[0],
          keyStance: parsedPdf.abstract.split(/[.!?]/)[0]?.slice(0, 140) || parsedPdf.title,
          excerpts: parsedPdf.excerpts
        };

        const extraction = await extractConceptsAndClaimsFromPdf(docId, parsedPdf, []);

        newDocuments.push(docSource);
        allNewConcepts.push(...extraction.concepts);
        allNewEdges.push(...extraction.edges);
        allNewClaims.push(...extraction.claims);
      }
    }

    if (newDocuments.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No valid PDF files or text content found.' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      documents: newDocuments,
      concepts: allNewConcepts,
      edges: allNewEdges,
      claims: allNewClaims
    });
  } catch (error: any) {
    console.error('Error during ingestion:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
