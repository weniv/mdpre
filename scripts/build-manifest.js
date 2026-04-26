#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const IGNORE = new Set([
    'node_modules', 'assets', 'font', 'dev', 'sample', 'scripts',
    '.git', '.github', '.vscode', '.idea'
]);
const LOGO_NAMES = ['logo.png', 'logo.jpg', 'logo.jpeg', 'logo.svg', 'logo.gif'];

function listPresentationFolders(rootDir) {
    const entries = fs.readdirSync(rootDir, { withFileTypes: true });
    const folders = [];

    for (const entry of entries) {
        if (!entry.isDirectory()) continue;
        if (entry.name.startsWith('.') || entry.name.startsWith('_')) continue;
        if (IGNORE.has(entry.name)) continue;

        const folderPath = path.join(rootDir, entry.name);
        const inner = fs.readdirSync(folderPath, { withFileTypes: true });

        const files = inner
            .filter(e => e.isFile() && e.name.toLowerCase().endsWith('.md'))
            .map(e => e.name)
            .sort((a, b) => a.localeCompare(b, 'ko'));

        if (files.length === 0) continue;

        const logo = inner
            .filter(e => e.isFile())
            .map(e => e.name)
            .find(name => LOGO_NAMES.includes(name.toLowerCase()));

        folders.push({
            name: entry.name,
            path: entry.name,
            files,
            ...(logo ? { logo } : {})
        });
    }

    folders.sort((a, b) => a.name.localeCompare(b.name, 'ko'));
    return folders;
}

const manifest = {
    generatedAt: new Date().toISOString(),
    folders: listPresentationFolders(ROOT)
};

const outPath = path.join(ROOT, 'manifest.json');
fs.writeFileSync(outPath, JSON.stringify(manifest, null, 2) + '\n', 'utf8');

console.log(`Wrote ${path.relative(ROOT, outPath)} (${manifest.folders.length} folders).`);
