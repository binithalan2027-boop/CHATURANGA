import { Room } from "colyseus";
import { GameStateSchema } from "../schema/GameStateSchema.js";
import { StandardChessRuleset, FogOfWarRuleset } from "@chaturanga/shared";
export class GameRoom extends Room {
    maxClients = 2;
    ruleset;
    gameState = null;
    onCreate(options) {
        this.setState(new GameStateSchema());
        if (options.variant === 'fog-of-war') {
            this.ruleset = new FogOfWarRuleset();
        }
        else {
            this.ruleset = new StandardChessRuleset();
        }
        this.onMessage("command", (client, message) => {
            if (!this.gameState)
                return;
            const playerColor = this.gameState.players.w === client.sessionId ? 'w' : 'b';
            if (message.playerColor !== playerColor) {
                client.send("error", "Not your turn or wrong color");
                return;
            }
            const result = this.ruleset.applyCommand(this.gameState, message);
            if (result.error) {
                client.send("error", result.error);
                return;
            }
            this.gameState = result.newState;
            this.broadcastState();
        });
    }
    onJoin(client, options) {
        console.log(client.sessionId, "joined!");
        if (this.clients.length === 2) {
            const players = {
                w: this.clients[0].sessionId,
                b: this.clients[1].sessionId
            };
            this.gameState = this.ruleset.getInitialState(players);
            this.broadcast("start", { message: "Game started!", color: { [this.clients[0].sessionId]: 'w', [this.clients[1].sessionId]: 'b' } });
            this.broadcastState();
        }
    }
    broadcastState() {
        if (!this.gameState)
            return;
        this.clients.forEach(client => {
            const color = this.gameState.players.w === client.sessionId ? 'w' : 'b';
            const playerView = this.ruleset.getPlayerView(this.gameState, color);
            client.send("state", playerView);
        });
    }
    onLeave(client, consented) {
        console.log(client.sessionId, "left!");
    }
}
