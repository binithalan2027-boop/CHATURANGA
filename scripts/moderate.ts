/** Server-host local reviewer command. Do not expose as an unauthenticated HTTP endpoint. */
import {Store} from '../server/store';
const store=new Store(process.env.DB_PATH??'data/chaturanga.sqlite');
const [action,id,status,...words]=process.argv.slice(2);
if(action==='list')console.log(JSON.stringify(store.all('report'),null,2));
else if(action==='resolve') {if(!['acknowledged','reviewing','resolved','rejected'].includes(status))throw Error('Invalid review status');const r=store.get<Record<string,unknown>>('report',id);if(!r)throw Error('Ticket not found');store.put('report',id,{...r,status,decision:words.join(' ').slice(0,1000),updatedAt:Date.now()});console.log('Updated ticket. No email sent.');}
else throw Error('Usage: npx tsx scripts/moderate.ts list | resolve TICKET STATUS DECISION');
store.close();
