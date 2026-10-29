const fs = require('fs');
const path = require('path');

const files = [
  'dist/index.html',
  'dist/about/index.html',
  'dist/modes/index.html',
  'dist/faq/index.html'
];

let allValid = true;

for (const file of files) {
  const fullPath = path.resolve(__dirname, '..', file);
  if (!fs.existsSync(fullPath)) {
    console.error(`Missing file: ${file}`);
    allValid = false;
    continue;
  }
  const content = fs.readFileSync(fullPath, 'utf8');
  const match = content.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
  if (!match) {
    console.error(`No JSON-LD script found in ${file}`);
    allValid = false;
    continue;
  }
  try {
    const parsed = JSON.parse(match[1]);
    console.log(`? ${file}: Valid JSON-LD (${parsed['@type'] || (parsed['@graph'] && parsed['@graph'].map(g => g['@type']).join(', '))})`);
  } catch (err) {
    console.error(`? ${file}: Invalid JSON:`, err.message);
    allValid = false;
  }
}

if (!allValid) {
  process.exit(1);
} else {
  console.log('All JSON-LD validations passed perfectly!');
}
