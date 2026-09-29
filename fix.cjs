const fs = require('fs'); 
const files = ['src/modes/StandardMode.tsx', 'src/modes/AtomicMode.tsx', 'src/modes/FogMode.tsx', 'src/modes/Chess960Mode.tsx', 'src/modes/SpellMode.tsx']; 
files.forEach(f => { 
  let c = fs.readFileSync(f, 'utf8'); 
  c = c.replace(/\\\`/g, '`'); 
  c = c.replace(/\\\$/g, '$'); 
  fs.writeFileSync(f, c); 
});
