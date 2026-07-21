const fs = require('fs');
const path = require('path');
const root = process.cwd();
const patterns = ["openid-client", "require('openid-client')", 'require(\"openid-client\")', 'inspect.custom', 'util.inspect'];
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full);
    } else if (full.endsWith('.js')) {
      const txt = fs.readFileSync(full, 'utf8');
      if (patterns.some((p) => txt.includes(p))) {
        console.log(full);
        patterns.forEach((p) => {
          if (txt.includes(p)) {
            console.log('  PATTERN', p);
          }
        });
      }
    }
  }
}
walk(path.join(root, 'node_modules'));
