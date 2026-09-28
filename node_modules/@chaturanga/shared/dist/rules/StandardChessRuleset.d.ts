import { GameState, Command, PlayerView, Ruleset, Color, GameEvent } from '../types.js';
export declare class StandardChessRuleset implements Ruleset {
    variant: string;
    getInitialState(players: Partial<Record<Color, string>>): GameState;
    applyCommand(state: GameState, command: Command): {
        newState: GameState;
        events: GameEvent[];
        error?: string;
    };
    getPlayerView(state: GameState, playerColor: Color): PlayerView;
    private extractBoard;
}
