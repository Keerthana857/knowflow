import { NextResponse } from 'next/server';
import { EMPTY_WORKSPACE } from '@/data/defaultBenchmark';
import { getGrokApiKey } from '@/lib/grok';
import { isFirebaseConfigured } from '@/lib/firebaseClient';

export async function GET() {
  return NextResponse.json({
    success: true,
    workspace: EMPTY_WORKSPACE,
    grokConfigured: Boolean(getGrokApiKey()),
    firebaseConfigured: isFirebaseConfigured()
  });
}

export async function POST() {
  return NextResponse.json({
    success: true,
    workspace: EMPTY_WORKSPACE
  });
}
