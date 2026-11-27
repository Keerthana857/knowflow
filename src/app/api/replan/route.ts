import { NextResponse } from 'next/server';
import { getWorkspace, updateWorkspace } from '@/lib/storage';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const minutes = Number(body.timeBudgetMinutes);

    if (isNaN(minutes) || minutes <= 0) {
      return NextResponse.json({ success: false, error: 'Invalid time budget' }, { status: 400 });
    }

    const updated = await updateWorkspace({
      availableTimeBudgetMinutes: minutes
    });

    return NextResponse.json({
      success: true,
      timeBudgetMinutes: minutes,
      crunchModeActive: updated.crunchModeActive,
      schedule: updated.schedule,
      workspace: updated
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
