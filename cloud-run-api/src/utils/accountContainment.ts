export type ContainmentStatus = 'deleted' | 'forced_out' | 'suspected' | 'suspended';
export type ContainmentAction = 'delete' | 'disable' | 'revoke';

interface AuthAccountController {
  revokeRefreshTokens(uid: string): Promise<void>;
  updateUser(uid: string, properties: { disabled: boolean }): Promise<unknown>;
  deleteUser(uid: string): Promise<void>;
}

interface AccessRecordWriter {
  set(data: Record<string, unknown>): Promise<unknown>;
}

export async function containAccount(
  auth: AuthAccountController,
  accessRecord: AccessRecordWriter,
  uid: string,
  status: ContainmentStatus,
  action: ContainmentAction,
): Promise<void> {
  await accessRecord.set({ active: false, status, updatedAt: new Date() });
  await auth.revokeRefreshTokens(uid);

  if (action === 'disable') await auth.updateUser(uid, { disabled: true });
  if (action === 'delete') await auth.deleteUser(uid);
}