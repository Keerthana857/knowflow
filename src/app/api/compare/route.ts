import { NextResponse } from 'next/server';
import { getWorkspace } from '@/lib/storage';

export async function GET() {
  try {
    const workspace = await getWorkspace();

    // Group claims by topic to highlight conflicts
    const claims = workspace.claims;
    const contradictions = claims.filter(c => !!c.contradictsClaimId);

    return NextResponse.json({
      success: true,
      claims,
      contradictionsCount: contradictions.length,
      contradictions,
      documentsCount: workspace.documents.length
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
