import { GameState, Ruleset, Command, PlayerView, Color } from '../types.js';
export declare class FogOfWarRuleset implements Ruleset {
    private baseRules;
    getInitialState(players: Partial<Record<Color, string>>): GameState;
    applyCommand(state: GameState, cmd: Command): {
        newState: GameState;
        error?: string;
    };
    getPlayerView(state: GameState, playerColor: Color): PlayerView;
}
