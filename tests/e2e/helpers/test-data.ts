// Every entity created by the e2e suite is tagged with this prefix so
// global-teardown.ts can find and delete it by name, since most modules
// (carriers, customers, loads, invoices, settlements) have no delete
// action in the app itself.
export const E2E_PREFIX = 'E2E_TEST_';

export function uniqueName(label: string): string {
  const stamp = `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  return `${E2E_PREFIX}${label}_${stamp}`;
}
