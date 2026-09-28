import { Schema, type } from "@colyseus/schema";

export class GameStateSchema extends Schema {
  @type("string")
  stateJson: string = "";
}
