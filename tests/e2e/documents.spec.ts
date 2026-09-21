import path from 'node:path';
import { test, expect } from './fixtures';

const SAMPLE_FILE = path.resolve(__dirname, 'fixtures-data/sample-pod.png');

test.describe('Documents & OCR', () => {
  test('loads with no console errors and shows the KPI ribbon + table', async ({ page, consoleErrors }) => {
    await page.goto('/documents');
    await expect(page.getByRole('heading', { name: /Documents & OCR Processing/i })).toBeVisible();
    await expect(page.getByText('Total Documents')).toBeVisible();
    expect(consoleErrors, JSON.stringify(consoleErrors, null, 2)).toEqual([]);
  });

  test('bulk upload modal accepts a file and starts the OCR pipeline', async ({ page }) => {
    // The OCR pipeline poll loop (bulk-pod-upload-modal.tsx) waits up to
    // ~40s on its own before giving up; give real network/OCR-provider
    // latency extra headroom beyond that so a slow-but-successful run
    // isn't cut off by the test itself first.
    test.setTimeout(150_000);
    await page.goto('/documents');
    await page.getByRole('button', { name: /Upload Document/i }).click();

    await expect(page.getByText('Upload Freight Documents')).toBeVisible();
    await page.locator('#pod-files').setInputFiles(SAMPLE_FILE);
    await expect(page.getByText('sample-pod.png')).toBeVisible();

    await page.getByRole('button', { name: /^Upload 1 POD$/ }).click();

    // The pipeline is upload -> OCR -> match/unmatch; a synthetic 10x10 PNG
    // won't extract a real PO number, so we only assert the async pipeline
    // actually ran to a terminal state rather than hanging on "Uploading".
    // Scoped to this file's own row -- "Failed"/"OCR Failed" also appear in
    // the page's static KPI card and filter <select>, which would otherwise
    // make the locator ambiguous.
    const fileRow = page.locator('div.rounded-lg.bg-white', { hasText: 'sample-pod.png' });
    // Scope to the status pill itself (FileStatusBadge's rounded-full span)
    // -- the row can also contain an inline error message that happens to
    // repeat the word "Failed", which would otherwise make this ambiguous.
    await expect(
      fileRow.locator('span.rounded-full').filter({ hasText: /Matched to load|Unmatched|Failed/i })
    ).toBeVisible({ timeout: 120_000 });
  });

  test('cancel closes the upload modal without starting anything', async ({ page }) => {
    await page.goto('/documents');
    await page.getByRole('button', { name: /Upload Document/i }).click();
    await page.getByRole('button', { name: /^Cancel$/ }).click();
    await expect(page.getByText('Upload Freight Documents')).toBeHidden();
  });
});
