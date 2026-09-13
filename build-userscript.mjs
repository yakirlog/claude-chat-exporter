#!/usr/bin/env node

import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const SOURCE_FILE = path.join(__dirname, 'claude-chat-exporter.js');
const OUTPUT_FILE = path.join(__dirname, 'claude-chat-exporter.user.js');

const VERSION = process.argv[2] ?? '1.0.0';

const ENTRY_POINT = 'setupClaudeExporter();';

const USERSCRIPT_HEADER = `// ==UserScript==
// @name         Claude Chat Exporter
// @namespace    https://github.com/yakirlog/claude-chat-exporter
// @version      ${VERSION}
// @description  Export the current Claude conversation to Markdown
// @author       agarwalvishal + Tampermonkey adaptation by yakirlog
// @match        https://claude.ai/*
// @grant        GM_registerMenuCommand
// @run-at       document-idle
// @updateURL    https://raw.githubusercontent.com/yakirlog/claude-chat-exporter/main/claude-chat-exporter.user.js
// @downloadURL  https://raw.githubusercontent.com/yakirlog/claude-chat-exporter/main/claude-chat-exporter.user.js
// ==/UserScript==

`;

const USERSCRIPT_FOOTER = `

// ============================================================================
// Tampermonkey integration
// ============================================================================

GM_registerMenuCommand(
  'Export Claude conversation',
  setupClaudeExporter
);
`;

async function build() {
  let source = await fs.readFile(SOURCE_FILE, 'utf8');

  // Normalize the file ending before validating the upstream entry point.
  source = source.trimEnd();

  if (!source.endsWith(ENTRY_POINT)) {
    throw new Error(
      [
        `Expected ${path.basename(SOURCE_FILE)} to end with:`,
        '',
        `  ${ENTRY_POINT}`,
        '',
        'The upstream entry point may have changed.',
        'Refusing to generate the userscript until the change is reviewed.'
      ].join('\n')
    );
  }

  // Remove only the final upstream invocation.
  source = source.slice(0, -ENTRY_POINT.length).trimEnd();

  const userscript =
    USERSCRIPT_HEADER +
    source +
    USERSCRIPT_FOOTER +
    '\n';

  await fs.writeFile(OUTPUT_FILE, userscript, 'utf8');

  console.log(`Built: ${path.basename(OUTPUT_FILE)}`);
  console.log(`Version: ${VERSION}`);
}

build().catch(error => {
  console.error(`Build failed:\n${error.message}`);
  process.exitCode = 1;
});
