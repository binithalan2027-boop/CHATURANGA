const http = require('http');
const fs = require('fs');
const path = require('path');

// Let's create static handler directly from server/static logic
const rootDir = path.resolve(__dirname, '..');
const base = path.join(rootDir, 'dist');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.json': 'application/json',
  '.webmanifest': 'application/manifest+json',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.ico': 'image/x-icon',
};

function serve(req, res) {
  const url = new URL(req.url, 'http://127.0.0.1:4188');
  let pathname = decodeURIComponent(url.pathname);
  const candidate = path.resolve(path.join(base, path.normalize(pathname)));
  if (candidate !== base && !candidate.startsWith(base + path.sep)) return false;
  let file = candidate;
  if (!fs.existsSync(file)) {
    const index = path.join(base, 'index.html');
    if (!fs.existsSync(index)) return false;
    file = index;
  } else if (fs.statSync(file).isDirectory()) {
    const dirIndex = path.join(file, 'index.html');
    if (fs.existsSync(dirIndex)) {
      file = dirIndex;
    } else {
      const index = path.join(base, 'index.html');
      if (!fs.existsSync(index)) return false;
      file = index;
    }
  }
  const ext = path.extname(file).toLowerCase();
  res.setHeader('Content-Type', MIME[ext] || 'application/octet-stream');
  res.writeHead(200);
  fs.createReadStream(file).pipe(res);
  return true;
}

const server = http.createServer((req, res) => {
  if (!serve(req, res)) {
    res.writeHead(404);
    res.end('Not Found');
  }
});

function fetchUrl(targetPath) {
  return new Promise((resolve, reject) => {
    http.get(`http://127.0.0.1:4188${targetPath}`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: data }));
    }).on('error', reject);
  });
}

server.listen(4188, async () => {
  console.log('Testing all endpoints via HTTP...');
  let failed = false;

  // 1. GET /
  const rHome = await fetchUrl('/');
  const homeOk = rHome.status === 200 && /<h1\b[^>]*>Chaturanga<\/h1>/i.test(rHome.body) && rHome.body.includes('Classic Chess') && rHome.body.includes('Chess MM');
  console.log(homeOk ? '? GET /: 200 OK with readable H1 and modes list' : '? GET / failed');
  if (!homeOk) failed = true;

  // 2. GET /about/
  const rAbout = await fetchUrl('/about/');
  const aboutOk = rAbout.status === 200 && rAbout.body.includes('Binit Halan') && rAbout.body.includes('About Chaturanga');
  console.log(aboutOk ? '? GET /about/: 200 OK with creator Binit Halan and overview' : '? GET /about/ failed');
  if (!aboutOk) failed = true;

  // 3. GET /modes/
  const rModes = await fetchUrl('/modes/');
  const modesOk = rModes.status === 200 && rModes.body.includes('Classic Chess') && rModes.body.includes('Chess960') && rModes.body.includes('Fog of War') && rModes.body.includes('Atomic Chess') && rModes.body.includes('Chess MM');
  console.log(modesOk ? '? GET /modes/: 200 OK with all 5 modes and rules' : '? GET /modes/ failed');
  if (!modesOk) failed = true;

  // 4. GET /faq/
  const rFaq = await fetchUrl('/faq/');
  const faqOk = rFaq.status === 200 && rFaq.body.includes('Frequently Asked Questions') && rFaq.body.includes('FAQPage') && rFaq.body.includes('Is Chaturanga free to play?');
  console.log(faqOk ? '? GET /faq/: 200 OK with FAQ items and FAQPage JSON-LD schema' : '? GET /faq/ failed');
  if (!faqOk) failed = true;

  // 5. GET /robots.txt
  const rRobots = await fetchUrl('/robots.txt');
  const robotsOk = rRobots.status === 200 && rRobots.body.includes('Sitemap: https://chaturangachess.games/sitemap.xml');
  console.log(robotsOk ? '? GET /robots.txt: 200 OK with Sitemap directive' : '? GET /robots.txt failed');
  if (!robotsOk) failed = true;

  // 6. GET /sitemap.xml
  const rSitemap = await fetchUrl('/sitemap.xml');
  const sitemapOk = rSitemap.status === 200 && rSitemap.body.includes('<loc>https://chaturangachess.games/</loc>') && rSitemap.body.includes('<loc>https://chaturangachess.games/about/</loc>') && rSitemap.body.includes('<loc>https://chaturangachess.games/modes/</loc>') && rSitemap.body.includes('<loc>https://chaturangachess.games/faq/</loc>');
  console.log(sitemapOk ? '? GET /sitemap.xml: 200 OK listing 4 live URLs' : '? GET /sitemap.xml failed');
  if (!sitemapOk) failed = true;

  // 7. GET /llms.txt
  const rLlms = await fetchUrl('/llms.txt');
  const llmsOk = rLlms.status === 200 && (rLlms.headers['content-type'] || '').includes('text/plain') && rLlms.body.includes('# Chaturanga') && rLlms.body.includes('Key Facts');
  console.log(llmsOk ? '? GET /llms.txt: 200 OK text/plain with calm project summary' : '? GET /llms.txt failed');
  if (!llmsOk) failed = true;

  // 8. GET /unknown-path (SPA fallback)
  const rUnknown = await fetchUrl('/unknown-chess-route-xyz');
  const unknownOk = rUnknown.status === 200 && rUnknown.body.includes('<div id="root"');
  console.log(unknownOk ? '? GET /unknown-path: 200 OK SPA fallback serves root app' : '? GET /unknown-path failed');
  if (!unknownOk) failed = true;

  server.close(() => {
    if (failed) {
      console.error('\nSome endpoint checks failed!');
      process.exit(1);
    } else {
      console.log('\nAll 8 endpoint checks verified successfully!');
      process.exit(0);
    }
  });
});
