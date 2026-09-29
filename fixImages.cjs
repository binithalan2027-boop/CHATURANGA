const fs = require('fs');
let c = fs.readFileSync('src/LandingPage.tsx', 'utf8');
c = c.replace(/src="https:\/\/lh3\.googleusercontent\.com\/([^"]+)"/g, (match, p1) => {
  if (p1.includes('=')) return match;
  return `src="https://lh3.googleusercontent.com/${p1}=s2048"`;
});
fs.writeFileSync('src/LandingPage.tsx', c);
