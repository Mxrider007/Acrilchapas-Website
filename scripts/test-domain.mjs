// Use the installed TypeScript compiler so tests work on Node without built-in TS.
import ts from 'typescript';
import { mkdtempSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
const directory = mkdtempSync(join(tmpdir(), 'acrilchapas-tests-'));
try {
  for (const name of ['domain', 'domain.test', 'commerce', 'commerce.test']) {
    const input = readFileSync(new URL(`../src/lib/${name}.ts`, import.meta.url), 'utf8').replace(/'\.\/(domain|commerce)(?:\.ts)?'/g, "'./$1.mjs'");
    const { outputText } = ts.transpileModule(input, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } });
    writeFileSync(join(directory, `${name}.mjs`), outputText);
  }
  const result = spawnSync(process.execPath, ['--test', join(directory, 'domain.test.mjs'), join(directory, 'commerce.test.mjs')], { stdio: 'inherit' });
  process.exitCode = result.status ?? 1;
} finally { rmSync(directory, { recursive: true, force: true }); }
