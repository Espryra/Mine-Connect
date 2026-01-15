import { Player, system } from "@minecraft/server";

declare module "@minecraft/server" {
  interface Player {
    sendError(message: string): void;
    sendSuccess(message: string): void;
  }
}

Player.prototype.sendError = function (message) {
  this.sendMessage(`§c${message}`);
  system.run(() => this.playSound("note.bass"));
};
Player.prototype.sendSuccess = function (message) {
  this.sendMessage(`§a${message}`);
  system.run(() => this.playSound("note.pling"));
};
