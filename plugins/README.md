# OpenClaw Plugin Development

This directory contains native OpenClaw tool plugins. Each plugin is developed
as a standalone TypeScript package and distributed as an npm `.tgz` archive.

## Requirements

- Node.js 22 or newer
- OpenClaw installed and available as `openclaw`
- A valid `~/.openclaw/openclaw.json`

Check the environment before building:

```bash
node --version
openclaw --version
openclaw config validate
```

OpenClaw reads its global config when running plugin commands. A JSON5 syntax
error in `~/.openclaw/openclaw.json` will block `plugin:build` and
`plugin:validate`, even when the plugin source itself is valid.

## Plugin Layout

Use one directory per plugin:

```text
plugin-name/
├── src/
│   ├── index.ts
│   └── index.test.ts
├── package.json
├── package-lock.json
├── tsconfig.json
├── openclaw.plugin.json
└── README.md
```

Generated files are stored in `dist/`. Dependencies are stored in
`node_modules/`. Neither directory replaces the TypeScript source.

## Create A Plugin

Create the package directory and install the shared dependencies:

```bash
mkdir -p plugins/example-exec/src
cd plugins/example-exec
npm init -y
npm install typebox
npm install --save-dev openclaw typescript vitest
```

Use this package configuration as the baseline, replacing the package name and
description:

```json
{
  "name": "example-exec",
  "version": "0.1.0",
  "type": "module",
  "private": true,
  "scripts": {
    "build": "tsc -p tsconfig.json",
    "plugin:build": "npm run build && openclaw plugins build --entry ./dist/index.js",
    "plugin:validate": "npm run build && openclaw plugins validate --entry ./dist/index.js",
    "test": "vitest run"
  },
  "files": [
    "dist",
    "openclaw.plugin.json",
    "README.md"
  ],
  "peerDependencies": {
    "openclaw": ">=2026.5.17"
  },
  "dependencies": {
    "typebox": "^1.1.38"
  },
  "devDependencies": {
    "openclaw": "latest",
    "typescript": "^5.9.0",
    "vitest": "^3.2.0"
  },
  "openclaw": {
    "extensions": [
      "./dist/index.js"
    ]
  }
}
```

Use a TypeScript configuration that excludes tests from the runtime package:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "declaration": true,
    "outDir": "dist",
    "skipLibCheck": true
  },
  "include": ["src/**/*.ts"],
  "exclude": ["src/**/*.test.ts"]
}
```

Implement `src/index.ts` with `defineToolPlugin` and TypeBox schemas. Keep the
tool contract narrow: define only the parameters and result fields OpenClaw
needs. Use `src/index.test.ts` to verify the registered tool name, command
arguments, and result parsing without calling a paid external service.

`openclaw.plugin.json` is generated metadata. Run `plugin:build` after changing
the plugin id, description, config schema, or tool contracts instead of editing
generated metadata by hand.

## Build And Test

Run the complete verification sequence from the plugin directory:

```bash
npm install
npm run build
npm test
openclaw config validate
npm run plugin:build
npm run plugin:validate
```

Do not package a plugin when tests or validation fail. If validation reports
that generated metadata is stale, run `npm run plugin:build` and validate again.

## Package For Transfer

Create the distributable archive:

```bash
npm pack
```

The `files` allowlist in `package.json` limits the archive to runtime files.
Inspect the result before moving it:

```bash
tar -tzf example-exec-0.1.0.tgz
sha256sum example-exec-0.1.0.tgz
mv -f example-exec-0.1.0.tgz ..
```

The final command requires both a source and destination. With the directory
layout above, `..` places the archive in the shared `plugins/` directory.

A typical runtime archive contains:

```text
package/dist/index.js
package/dist/index.d.ts
package/openclaw.plugin.json
package/package.json
package/README.md
```

Source files, tests, `tsconfig.json`, `package-lock.json`, and `node_modules/`
are intentionally excluded from the runtime archive.

## Install On Another Computer

Copy the `.tgz` archive to the target computer and install it directly:

```bash
openclaw plugins install /path/to/example-exec-0.1.0.tgz
```

Add the tool name declared by the plugin to the active tool profile without
replacing existing entries:

```json
{
  "tools": {
    "alsoAllow": ["example_exec"]
  }
}
```

Restart the OpenClaw gateway, then verify cold metadata and runtime tool
registration:

```bash
openclaw plugins inspect example-exec --json
openclaw plugins inspect example-exec --runtime --json
```

## Backup Policy

For reinstalling a released plugin, back up its versioned `.tgz` archive and
checksum. For future editing or rebuilding, also back up the complete source
directory or keep it in version control.

Do not back up `node_modules/`; restore dependencies with `npm install`.
