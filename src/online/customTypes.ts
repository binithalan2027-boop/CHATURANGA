import type {CrossState} from './crossRules';
import type {Power,State} from '../chaturanga/engine';
import type {ChatMessage} from './types';
export type CustomKind='mind'|'mantra'|'cross3'|'cross4';
export interface CustomView {id:string;kind:CustomKind;players:{id:string;name:string;seat:string}[];capacity:number;version:number;status:'waiting'|'active'|'finished';yourSeat:string;turn:string;result:string|null;cross?:CrossState;chat?:ChatMessage[];math?:{fen:string;phase:State['phase'];clocks:State['clocks'];question:{id:number;text:string}|null;inventory:State['inventory'];effects:State['effects'];options:Power[];rewardWinner:string|null;notice:string;events:string[];deadline:number;canAct:boolean;submove:number};}
