import { GameState, Ruleset, Command, PlayerView, Color, GameEvent } from '../types.js';
export declare class SpellChessRuleset implements Ruleset {
    variant: string;
    private baseRules;
    getInitialState(players: Partial<Record<Color, string>>): GameState;
    applyCommand(state: GameState, command: Command): {
        newState: GameState;
        events: GameEvent[];
        error?: string;
    };
    getPlayerView(state: GameState, playerColor: Color): PlayerView;
}
