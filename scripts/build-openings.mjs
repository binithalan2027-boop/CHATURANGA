import fs from 'node:fs';
import { Chess } from 'chess.js';
const entries=[];
for(const volume of ['a','b','c','d','e']) {
 const lines=fs.readFileSync(`${process.argv[2] || "/tmp/chaturanga-eco-source"}/${volume}.tsv`,'utf8').trim().split('\n').slice(1);
 for(const line of lines){const [eco,name,pgn]=line.split('\t');const c=new Chess();c.loadPgn(pgn);entries.push({eco,name,pgn,key:c.fen().split(' ').slice(0,4).join(' ')});}
}
fs.writeFileSync('src/chaturanga/data/eco.json',JSON.stringify(entries));console.log('legally verified entries',entries.length);
