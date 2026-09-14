# Claude Chat Exporter — Tampermonkey Adaptation

## Overview

This fork adds a Tampermonkey userscript version of
agarwalvishal/claude-chat-exporter.

The original project is implemented as a bookmarklet. This fork keeps the
original exporter source unchanged and generates a self-contained Tampermonkey
userscript from it.

## Goals

- Use the exporter through Tampermonkey instead of a bookmarklet.
- Keep the upstream exporter code unchanged.
- Minimize the adaptation layer.
- Make upstream updates easy to incorporate.
- Avoid downloading and executing exporter code dynamically at runtime.

## Architecture

claude-chat-exporter.js
        |
        | build-userscript.mjs
        v
claude-chat-exporter.user.js
        |
        v
Tampermonkey
        |
        v
claude.ai

### claude-chat-exporter.js

Upstream exporter source.

Do not make userscript-specific changes to this file.

Keeping it unchanged allows the fork to remain easy to synchronize with
upstream.

### build-userscript.mjs

Generates the Tampermonkey userscript.

The builder:

1. Reads claude-chat-exporter.js.
2. Verifies that its final entry point is:

   setupClaudeExporter();

3. Removes that automatic invocation.
4. Prepends Tampermonkey metadata.
5. Adds:

   GM_registerMenuCommand(
       'Export Claude conversation',
       setupClaudeExporter
   );

6. Writes claude-chat-exporter.user.js.

The build intentionally fails if the expected upstream entry point changes.

### claude-chat-exporter.user.js

Generated file installed in Tampermonkey.

Do not edit it manually.

## Why the userscript is self-contained

An earlier prototype downloaded the upstream JavaScript from GitHub at runtime
and executed it.

That worked, but the final architecture embeds the exporter directly in the
userscript.

Benefits:

- no runtime dependency on GitHub;
- no dynamic code execution;
- updates can be reviewed before installation;
- the installed userscript corresponds to known source code.

## Authentication and cookies

The exporter reads Claude's `lastActiveOrg` cookie through `document.cookie`.

The actual Claude authentication cookie does not need to be readable by the
userscript. The browser includes authentication credentials automatically in
the exporter's same-origin requests through:

    fetch(..., { credentials: 'include' })

## Building

Example:

    node build-userscript.mjs 1.0.0

Output:

    claude-chat-exporter.user.js

The version argument becomes the Tampermonkey `@version`.

## Upstream update workflow

1. Receive notification that upstream `claude-chat-exporter.js` changed.
2. Review the upstream diff.
3. Sync this fork with upstream.
4. Confirm that the exporter still uses:

       setupClaudeExporter();

   as its entry point.
5. Run:

       node build-userscript.mjs <new-version>

6. Test the generated userscript in Tampermonkey.
7. Commit `claude-chat-exporter.user.js`.

Tampermonkey receives the new version through its `@updateURL` /
`@downloadURL`.

## Breaking upstream changes

The build script deliberately validates the expected entry point.

If upstream changes its execution architecture, the build fails rather than
silently generating an invalid userscript.

At that point the Tampermonkey adaptation must be reviewed.

## Design principle

Keep the adaptation as small as possible:

    upstream exporter
          +
    Tampermonkey metadata
          +
    menu-command invocation

The actual exporting logic should remain owned by the upstream project.
