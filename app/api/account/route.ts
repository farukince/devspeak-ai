import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getServerDatabase } from '@/lib/database/server';
import { ApiSecurityError, enforceRateLimit, readJsonWithLimit } from '@/lib/security/api';

const deleteAccountSchema = z.object({ confirmation: z.literal('DELETE') }).strict();

export async function DELETE(request: NextRequest) {
  try {
    const database = await getServerDatabase();
    await enforceRateLimit(database.client, 'account:delete', 2, 3600);
    await readJsonWithLimit(request, deleteAccountSchema, 1000);
    const { error } = await database.client.rpc('delete_current_user');
    if (error) throw new Error(`Delete account failed: ${error.message}`);
    return NextResponse.json({ deleted: true });
  } catch (error) {
    if (error instanceof ApiSecurityError) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: error.status });
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Type DELETE to confirm account deletion.' }, { status: 400 });
    }
    if (error instanceof Error && error.message === 'Authentication required.') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Account deletion failed:', error);
    return NextResponse.json({ error: 'Account could not be deleted.' }, { status: 500 });
  }
}
