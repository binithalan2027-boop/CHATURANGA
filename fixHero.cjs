const fs = require('fs');
['src/ProfilePage.tsx', 'src/components/landing/HeroSection.tsx'].forEach(f => {
  let c = fs.readFileSync(f, 'utf8');
  c = c.replace(/\\\`/g, '`');
  c = c.replace(/\\\$/g, '$');
  fs.writeFileSync(f, c);
});
