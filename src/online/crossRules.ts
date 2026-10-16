/** Original Chaturanga cross-board house rules. Not Chess.com/FIDE rules. */
export type Seat = 'south'|'west'|'north'|'east';
export type PieceKind = 'p'|'n'|'b'|'r'|'q'|'k';
export interface CrossPiece { seat: Seat; kind: PieceKind; moved?: boolean }
export interface CrossState { board: Record<number,CrossPiece>; seats: Seat[]; turn: Seat; eliminated: Seat[]; moves: string[]; result: string|null; clocks: Record<Seat,number>; lastAt: number }
export const SEATS: Seat[] = ['south','west','north','east'];
export const crossSquare = (i:number) => `${String.fromCharCode(97+i%14)}${14-Math.floor(i/14)}`;
export const validCell = (r:number,c:number) => r>=0&&r<14&&c>=0&&c<14&&!((r<3||r>10)&&(c<3||c>10));
const vector:Record<Seat,[number,number]> = {south:[-1,0],west:[0,1],north:[1,0],east:[0,-1]};
export function crossGame(count:3|4, ms:number, now:number):CrossState {
 const seats = count===3 ? SEATS.filter(s=>s!=='north') : [...SEATS];
 const board:Record<number,CrossPiece>={};
 const back:PieceKind[]=['r','n','b','q','k','b','n','r'];
 for(const seat of seats) for(let i=0;i<8;i++) {
  const cells = seat==='south'?[[13,i+3],[12,i+3]]:seat==='north'?[[0,10-i],[1,10-i]]:seat==='west'?[[10-i,0],[10-i,1]]:[[i+3,13],[i+3,12]];
  board[cells[0][0]*14+cells[0][1]]={seat,kind:back[i]}; board[cells[1][0]*14+cells[1][1]]={seat,kind:'p'};
 }
 return {board,seats,turn:seats[0],eliminated:[],moves:[],result:null,clocks:{south:ms,west:ms,north:ms,east:ms},lastAt:now};
}
export function crossMoves(s:CrossState,from:number):number[] {
 const p=s.board[from]; if(!p||p.seat!==s.turn||s.result||s.eliminated.includes(p.seat))return [];
 const r=Math.floor(from/14),c=from%14,out:number[]=[];
 const add=(a:number,b:number)=> {if(!validCell(a,b))return false;const q=s.board[a*14+b];if(q?.seat===p.seat)return false;out.push(a*14+b);return !q;};
 if(p.kind==='p') {
  const [dr,dc]=vector[p.seat],a=r+dr,b=c+dc;
  if(validCell(a,b)&&!s.board[a*14+b]) {out.push(a*14+b); if(!p.moved&&validCell(a+dr,b+dc)&&!s.board[(a+dr)*14+b+dc])out.push((a+dr)*14+b+dc);}
  for(const d of [-1,1]) {const x=a+(dr===0?d:0),y=b+(dc===0?d:0),q=s.board[x*14+y];if(validCell(x,y)&&q&&q.seat!==p.seat)out.push(x*14+y);}
 } else if(p.kind==='n') for(const [dr,dc] of [[1,2],[2,1],[-1,2],[-2,1],[1,-2],[2,-1],[-1,-2],[-2,-1]])add(r+dr,c+dc);
 else {const dirs = p.kind==='b'?[[1,1],[1,-1],[-1,1],[-1,-1]]:p.kind==='r'?[[1,0],[-1,0],[0,1],[0,-1]]:[[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]];
  for(const [dr,dc]of dirs)for(let n=1;n<14;n++){if(!add(r+dr*n,c+dc*n)||p.kind==='k')break;}
 }
 return out;
}
function nextSeat(s:CrossState) {const at=s.seats.indexOf(s.turn);for(let n=1;n<=s.seats.length;n++){const seat=s.seats[(at+n)%s.seats.length];if(!s.eliminated.includes(seat)){s.turn=seat;return;}}}
export function crossEliminate(s:CrossState, seat:Seat, reason:string) {
 if(s.eliminated.includes(seat)||s.result)return;
 s.eliminated.push(seat);for(const [i,p]of Object.entries(s.board))if(p.seat===seat)delete s.board[+i];
 s.moves.push(`${seat} eliminated: ${reason}`);
 const alive=s.seats.filter(x=>!s.eliminated.includes(x));if(alive.length===1)s.result=`${alive[0]} wins`;else if(s.turn===seat)nextSeat(s);
}
export function crossTick(original:CrossState,now:number):CrossState {const s=structuredClone(original); if(s.result)return s; const dt=Math.max(0,now-s.lastAt);s.lastAt=now;s.clocks[s.turn]=Math.max(0,s.clocks[s.turn]-dt);if(s.clocks[s.turn]===0)crossEliminate(s,s.turn,'time');return s;}
export function crossPlay(original:CrossState,from:number,to:number,now:number):CrossState {
 const s=crossTick(original,now);if(!crossMoves(s,from).includes(to))throw Error('Illegal cross-board move.');
 const p=s.board[from],q=s.board[to];delete s.board[from];
 if(q?.kind==='k')crossEliminate(s,q.seat,'king captured');
 const r=Math.floor(to/14),c=to%14,promote=p.kind==='p'&&(p.seat==='south'?r<=3:p.seat==='north'?r>=10:p.seat==='west'?c>=10:c<=3);
 s.board[to]={...p,kind:promote?'q':p.kind,moved:true};s.moves.push(`${s.turn} ${crossSquare(from)}-${crossSquare(to)}${promote?'=Q':''}`);
 if(!s.result) {nextSeat(s);if(!Object.keys(s.board).some(i=>crossMoves(s,+i).length))crossEliminate(s,s.turn,'no legal moves');}
 return s;
}
