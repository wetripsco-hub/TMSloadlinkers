#!/usr/bin/env node
// Turns Playwright's JSON reporter output (reports/e2e-results.json) into
// the flat per-module audit summary the e2e task asked for: tests run,
// passed, failed, console errors found, and failure screenshots.
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import path from "node:path";

const RESULTS_PATH = path.resolve("reports/e2e-results.json");
const OUTPUT_PATH = path.resolve("reports/e2e-audit-summary.json");

if (!existsSync(RESULTS_PATH)) {
  console.error(`No Playwright JSON report found at ${RESULTS_PATH}. Run \`npm run test:e2e\` first.`);
  process.exit(1);
}

const report = JSON.parse(readFileSync(RESULTS_PATH, "utf-8"));

function moduleNameForFile(file) {
  return path.basename(file, ".spec.ts");
}

/** @type {Map<string, { module: string, testsRun: number, passed: number, failed: number, skipped: number, consoleErrors: any[], failureScreenshots: string[] }>} */
const byModule = new Map();

function ensureModule(file) {
  const moduleName = moduleNameForFile(file);
  if (!byModule.has(moduleName)) {
    byModule.set(moduleName, {
      module: moduleName,
      testsRun: 0,
      passed: 0,
      failed: 0,
      skipped: 0,
      consoleErrors: [],
      failureScreenshots: [],
    });
  }
  return byModule.get(moduleName);
}

function walkSuite(suite, file) {
  const currentFile = suite.file ?? file;

  for (const spec of suite.specs ?? []) {
    const entry = ensureModule(spec.file ?? currentFile);
    for (const test of spec.tests ?? []) {
      const result = test.results?.[test.results.length - 1];
      if (!result) continue;

      entry.testsRun += 1;
      if (result.status === "passed") entry.passed += 1;
      else if (result.status === "skipped") entry.skipped += 1;
      else entry.failed += 1;

      for (const attachment of result.attachments ?? []) {
        if (attachment.name === "console-errors" && attachment.body) {
          try {
            const decoded = Buffer.from(attachment.body, "base64").toString("utf-8");
            entry.consoleErrors.push({ test: spec.title, errors: JSON.parse(decoded) });
          } catch {
            // best-effort -- malformed attachment shouldn't crash the summary
          }
        }
        if (attachment.name === "screenshot" && attachment.path) {
          entry.failureScreenshots.push(attachment.path);
        }
      }
    }
  }

  for (const child of suite.suites ?? []) {
    walkSuite(child, currentFile);
  }
}

for (const suite of report.suites ?? []) {
  walkSuite(suite, suite.file);
}

const summary = {
  generatedAt: new Date().toISOString(),
  stats: report.stats ?? null,
  modules: Array.from(byModule.values()).sort((a, b) => a.module.localeCompare(b.module)),
};

writeFileSync(OUTPUT_PATH, JSON.stringify(summary, null, 2));
console.log(`Wrote ${OUTPUT_PATH}`);
for (const m of summary.modules) {
  console.log(
    `  ${m.module}: ${m.testsRun} run, ${m.passed} passed, ${m.failed} failed, ${m.skipped} skipped, ${m.consoleErrors.length} console-error test(s)`
  );
}
