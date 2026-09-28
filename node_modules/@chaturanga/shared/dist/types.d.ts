export type Color = 'w' | 'b' | 'r' | 'y' | 'g';
export type PieceSymbol = 'p' | 'n' | 'b' | 'r' | 'q' | 'k';
export interface Piece {
    color: Color;
    type: PieceSymbol;
    isDead?: boolean;
}
export type Square = string;
export type BoardRecord = Record<Square, Piece>;
export interface GameState {
    version: number;
    variant: string;
    status: 'lobby' | 'playing' | 'draw' | 'win' | 'aborted';
    turn: Color;
    board: BoardRecord;
    history: Command[];
    clocks?: Record<Color, number>;
    players: Partial<Record<Color, string>>;
    winner?: Color | null;
    lastMove?: {
        from: Square;
        to: Square;
        piece: Piece;
    };
    fen?: string;
}
export type CommandType = 'move' | 'use_power' | 'resign' | 'offer_draw' | 'accept_draw';
export interface BaseCommand {
    type: CommandType;
    playerColor: Color;
    version: number;
}
export interface MoveCommand extends BaseCommand {
    type: 'move';
    from: Square;
    to: Square;
    promotion?: PieceSymbol;
}
export type Command = MoveCommand | BaseCommand;
export type EventType = 'move' | 'capture' | 'check' | 'game_over' | 'power_used';
export interface BaseEvent {
    type: EventType;
}
export interface MoveEvent extends BaseEvent {
    type: 'move';
    from: Square;
    to: Square;
    piece: Piece;
}
export interface CaptureEvent extends BaseEvent {
    type: 'capture';
    square: Square;
    captured: Piece;
    capturedBy?: Piece;
}
export type GameEvent = MoveEvent | CaptureEvent | BaseEvent;
export interface PlayerView {
    version: number;
    variant: string;
    status: GameState['status'];
    turn: Color;
    board: BoardRecord;
    clocks?: Record<Color, number>;
    myColor: Color;
    winner?: Color | null;
    lastMove?: {
        from: Square;
        to: Square;
        piece: Piece;
    };
}
export interface Ruleset {
    variant: string;
    getInitialState(players: Partial<Record<Color, string>>): GameState;
    applyCommand(state: GameState, command: Command): {
        newState: GameState;
        events: GameEvent[];
        error?: string;
    };
    getPlayerView(state: GameState, playerColor: Color): PlayerView;
}
