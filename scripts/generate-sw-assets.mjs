import fs from 'fs/promises';
import path from 'path';

// Determine dist directory (match server.ts logic)
const candidates = ['dist', 'build', 'public'];
let distDir = candidates.find((d) => {
  try {
    return fs.statSync(path.join(process.cwd(), d)).isDirectory();
  } catch (e) {
    return false;
  }
});

if (!distDir) {
  // default to dist
  distDir = 'dist';
}

const distPath = path.join(process.cwd(), distDir);

async function walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      const sub = await walk(full);
      files.push(...sub);
    } else if (entry.isFile()) {
      // skip source maps
      if (full.endsWith('.map')) continue;
      // skip sw-assets.json itself
      if (path.basename(full) === 'sw-assets.json') continue;
      files.push(full);
    }
  }
  return files;
}

(async () => {
  try {
    await fs.access(distPath);
  } catch (err) {
    console.error(`Dist directory not found at ${distPath}. Run build first.`);
    process.exit(0);
  }

  const files = await walk(distPath);
  // Convert to web paths relative to distPath root
  const paths = files.map((f) => {
    let rel = path.relative(distPath, f);
    // Use POSIX separators for URLs
    rel = rel.split(path.sep).join('/');
    return '/' + rel;
  });

  // Ensure index.html and offline.html are present at root
  if (!paths.includes('/index.html') && await exists(path.join(distPath, 'index.html'))) {
    paths.unshift('/index.html');
  }
  if (!paths.includes('/offline.html') && await exists(path.join(distPath, 'offline.html'))) {
    paths.unshift('/offline.html');
  }

  const outPath = path.join(distPath, 'sw-assets.json');
  await fs.writeFile(outPath, JSON.stringify(paths, null, 2), 'utf8');
  console.log(`Wrote ${paths.length} entries to ${outPath}`);

  function exists(p) {
    try {
      return fs.statSync(p).isFile();
    } catch (e) {
      return false;
    }
  }
})();
