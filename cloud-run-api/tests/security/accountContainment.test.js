const { containAccount } = require('../../dist/utils/accountContainment');

function createDependencies(events) {
  return {
    auth: {
      revokeRefreshTokens: async () => { events.push('revoke'); },
      updateUser: async () => { events.push('disable'); },
      deleteUser: async () => { events.push('delete'); },
    },
    accessRecord: {
      set: async (data) => { events.push(`deny:${data.status}`); },
    },
  };
}

describe('account containment', () => {
  test.each([
    ['suspended', 'disable', ['deny:suspended', 'revoke', 'disable']],
    ['suspected', 'disable', ['deny:suspected', 'revoke', 'disable']],
    ['deleted', 'delete', ['deny:deleted', 'revoke', 'delete']],
    ['forced_out', 'revoke', ['deny:forced_out', 'revoke']],
  ])('establishes denial before %s account actions', async (status, action, expected) => {
    const events = [];
    const { auth, accessRecord } = createDependencies(events);

    await containAccount(auth, accessRecord, 'target-user', status, action);

    expect(events).toEqual(expected);
  });
});