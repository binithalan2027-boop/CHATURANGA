import { GameState, Ruleset, Command, PlayerView, Color, MathTrial, PlayerExtState, GameEvent, TrialCommand, CastCommand, MoveCommand } from '../types.js';
import { StandardChessRuleset } from './StandardChessRuleset.js';

export class SpellChessRuleset implements Ruleset {
  variant = 'spell-chess';
  private baseRules = new StandardChessRuleset();

  getInitialState(players: Partial<Record<Color, string>>): GameState {
    const state = this.baseRules.getInitialState(players);
    state.variant = this.variant;
    state.playerStates = {
      w: { spells: [] },
      b: { spells: [] }
    };
    state.frozenSquares = {};
    return state;
  }

  applyCommand(state: GameState, command: Command): { newState: GameState, events: GameEvent[], error?: string } {
    if (command.type === 'request_trial') {
      // Generate a math problem
      const a = Math.floor(Math.random() * 20) + 5;
      const b = Math.floor(Math.random() * 20) + 5;
      const answer = a + b; // simple for MVP
      const question = `${a} + ${b} = ?`;

      const newState = { ...state, playerStates: { ...state.playerStates } };
      newState.playerStates![command.playerColor] = {
        ...newState.playerStates![command.playerColor],
        activeTrial: { question, answer, expiresAt: Date.now() + 10000 }
      };
      
      return { newState, events: [] };
    }

    if (command.type === 'answer_trial') {
      const trialCmd = command as TrialCommand;
      const pState = state.playerStates![command.playerColor];
      
      if (!pState.activeTrial) {
        return { newState: state, events: [], error: "No active trial" };
      }

      const newState = { ...state, playerStates: { ...state.playerStates } };
      const newPState = { ...pState, activeTrial: undefined };
      
      if (Date.now() <= pState.activeTrial.expiresAt && trialCmd.answer === pState.activeTrial.answer) {
        newPState.spells = [...newPState.spells, 'freeze'];
      }
      
      newState.playerStates![command.playerColor] = newPState;
      return { newState, events: [] };
    }

    if (command.type === 'cast_spell') {
      const castCmd = command as CastCommand;
      const pState = state.playerStates![command.playerColor];
      
      if (!pState.spells.includes(castCmd.spellName)) {
        return { newState: state, events: [], error: "You don't have this spell" };
      }

      const newState = { ...state, playerStates: { ...state.playerStates }, frozenSquares: { ...state.frozenSquares } };
      
      // Remove spell
      const spellIdx = newState.playerStates![command.playerColor].spells.indexOf(castCmd.spellName);
      newState.playerStates![command.playerColor].spells.splice(spellIdx, 1);

      if (castCmd.spellName === 'freeze') {
        // Freeze square for 2 turns (1 full round = 2 ply)
        newState.frozenSquares![castCmd.target] = 2;
      }

      return { newState, events: [{ type: 'power_used' }] };
    }

    if (command.type === 'move') {
      const moveCmd = command as MoveCommand;
      // Check if FROM or TO square is frozen
      if (state.frozenSquares && (state.frozenSquares[moveCmd.from] > 0 || state.frozenSquares[moveCmd.to] > 0)) {
        return { newState: state, events: [], error: "Square is frozen!" };
      }

      const result = this.baseRules.applyCommand(state, command);
      if (result.error) return result;

      // Decrement freeze counters
      if (result.newState.frozenSquares) {
        const updatedFrozen = { ...result.newState.frozenSquares };
        for (const sq in updatedFrozen) {
          if (updatedFrozen[sq] > 0) {
            updatedFrozen[sq] -= 1;
            if (updatedFrozen[sq] === 0) delete updatedFrozen[sq];
          }
        }
        result.newState.frozenSquares = updatedFrozen;
      }

      return result;
    }

    return { newState: state, events: [], error: "Unknown command" };
  }

  getPlayerView(state: GameState, playerColor: Color): PlayerView {
    const view = this.baseRules.getPlayerView(state, playerColor);
    // Add extension states
    (view as any).playerStates = state.playerStates;
    (view as any).frozenSquares = state.frozenSquares;
    
    // Mask enemy active trials
    if ((view as any).playerStates) {
      const pStates = (view as any).playerStates;
      for (const color in pStates) {
        if (color !== playerColor && pStates[color].activeTrial) {
          pStates[color] = { ...pStates[color], activeTrial: { question: '???', answer: 0, expiresAt: 0 } };
        }
      }
    }
    
    return view;
  }
}
