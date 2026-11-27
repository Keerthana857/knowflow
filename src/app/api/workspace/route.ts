import { NextResponse } from 'next/server';
import { EMPTY_WORKSPACE } from '@/data/defaultBenchmark';
import { getGrokApiKey, verifyGrokApiKey } from '@/lib/grok';
import { isFirebaseConfigured } from '@/lib/firebaseClient';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const checkGrok = searchParams.get('verifyGrok') === '1';

  let grokHealth: { ok: boolean; status: string; message: string } | undefined;
  if (checkGrok) {
    grokHealth = await verifyGrokApiKey();
  }

  return NextResponse.json({
    success: true,
    workspace: EMPTY_WORKSPACE,
    grokConfigured: Boolean(getGrokApiKey()),
    grokHealth,
    firebaseConfigured: isFirebaseConfigured()
  });
}

export async function POST() {
  return NextResponse.json({
    success: true,
    workspace: EMPTY_WORKSPACE
  });
}
