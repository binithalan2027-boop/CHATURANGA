const fs = require('fs');
let c = fs.readFileSync('src/ProfilePage.tsx', 'utf8');
c = c.replace(/\\\`/g, '`');
c = c.replace(/\\\$/g, '$');
fs.writeFileSync('src/ProfilePage.tsx', c);
