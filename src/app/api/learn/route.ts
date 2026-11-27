import { NextResponse } from 'next/server';
import { getWorkspace, updateWorkspace } from '@/lib/storage';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const conceptId = searchParams.get('conceptId');

    const workspace = await getWorkspace();
    const concept = workspace.concepts.find(c => c.id === conceptId) || workspace.concepts[0];

    return NextResponse.json({
      success: true,
      concept
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { conceptId } = body;

    const workspace = await getWorkspace();
    const concept = workspace.concepts.find(c => c.id === conceptId);

    if (!concept) {
      return NextResponse.json({ success: false, error: 'Concept not found' }, { status: 404 });
    }

    // Set as active concept
    const updated = await updateWorkspace({ activeConceptId: conceptId });

    return NextResponse.json({
      success: true,
      concept,
      workspace: updated
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
