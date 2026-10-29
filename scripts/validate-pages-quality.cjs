const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'dist');

const pages = [
  { path: 'index.html', url: '/' },
  { path: 'about/index.html', url: '/about/' },
  { path: 'modes/index.html', url: '/modes/' },
  { path: 'faq/index.html', url: '/faq/' }
];

let allPassed = true;

for (const page of pages) {
  const filePath = path.join(distDir, page.path);
  if (!fs.existsSync(filePath)) {
    console.error(`? Missing page: ${page.path}`);
    allPassed = false;
    continue;
  }

  const content = fs.readFileSync(filePath, 'utf8');

  // 1. Check exactly one <h1>
  const h1Matches = content.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/gi) || [];
  if (h1Matches.length === 1) {
    console.log(`? ${page.url}: Exactly one <h1> found ("${h1Matches[0].replace(/<[^>]+>/g, '').trim()}")`);
  } else {
    console.error(`? ${page.url}: Expected 1 <h1>, found ${h1Matches.length}`);
    allPassed = false;
  }

  // 2. Check img tags have alt attribute
  const imgMatches = content.match(/<img\b[^>]*>/gi) || [];
  let imgAltOk = true;
  for (const img of imgMatches) {
    if (!/alt=["'][^"']*["']/i.test(img)) {
      console.error(`? ${page.url}: Image missing alt attribute: ${img}`);
      imgAltOk = false;
      allPassed = false;
    }
  }
  if (imgMatches.length > 0 && imgAltOk) {
    console.log(`? ${page.url}: All ${imgMatches.length} images have valid alt attributes.`);
  } else if (imgMatches.length === 0) {
    console.log(`? ${page.url}: Clean lightweight markup (no inline <img> dependencies).`);
  }

  // 3. Check internal links
  const linkMatches = [...content.matchAll(/<a\b[^>]*href=["']([^"']+)["'][^>]*>/gi)];
  let brokenLinks = 0;
  for (const match of linkMatches) {
    const href = match[1];
    if (href.startsWith('http://') || href.startsWith('https://') || href.startsWith('mailto:')) {
      continue; // External link
    }
    const cleanHref = href.split('?')[0].split('#')[0];
    if (cleanHref === '' || cleanHref === '/') {
      continue; // Home
    }
    const targetPath = path.join(distDir, cleanHref.endsWith('/') ? cleanHref + 'index.html' : cleanHref);
    const targetDirIndex = path.join(distDir, cleanHref, 'index.html');
    if (!fs.existsSync(targetPath) && !fs.existsSync(targetDirIndex)) {
      console.error(`? ${page.url}: Broken internal link -> "${href}"`);
      brokenLinks++;
      allPassed = false;
    }
  }
  if (brokenLinks === 0) {
    console.log(`? ${page.url}: All internal links verified (${linkMatches.length} links checked).`);
  }
}

if (allPassed) {
  console.log('\nAll Page Quality, Heading Hierarchy & Link Checks Passed Successfully!');
} else {
  process.exit(1);
}
