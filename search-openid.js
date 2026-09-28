async function main() {
  const fs = await import('node:fs');
  const path = await import('node:path');
  const root = process.cwd();
  const patterns = ["openid-client", "require('openid-client')", 'require("openid-client")', 'inspect.custom', 'util.inspect'];
  function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full);
      } else if (full.endsWith('.js')) {
        const txt = fs.readFileSync(full, 'utf8');
        if (patterns.some((pattern) => txt.includes(pattern))) {
          console.log(full);
          patterns.forEach((pattern) => {
            if (txt.includes(pattern)) {
              console.log('  PATTERN', pattern);
            }
          });
        }
      }
    }
  }
  walk(path.join(root, 'node_modules'));
}

void main();
