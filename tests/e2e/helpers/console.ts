import type { Page, ConsoleMessage } from '@playwright/test';

export interface CapturedConsoleError {
  text: string;
  location: string;
}

// Next.js dev mode and third-party embeds emit noise that isn't an app bug;
// filter it so "no console errors" means something.
const IGNORED_PATTERNS: RegExp[] = [
  /Download the React DevTools/i,
  /\[Fast Refresh\]/i,
  /favicon\.ico/i,
];

export function captureConsoleErrors(page: Page): CapturedConsoleError[] {
  const errors: CapturedConsoleError[] = [];

  page.on('console', (msg: ConsoleMessage) => {
    if (msg.type() !== 'error') return;
    const text = msg.text();
    if (IGNORED_PATTERNS.some((pattern) => pattern.test(text))) return;

    const loc = msg.location();
    errors.push({
      text,
      location: loc?.url ? `${loc.url}:${loc.lineNumber}` : 'unknown',
    });
  });

  page.on('pageerror', (err) => {
    errors.push({ text: `Uncaught exception: ${err.message}`, location: 'pageerror' });
  });

  return errors;
}
