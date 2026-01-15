import type { PlayerJoinAfterEvent } from "@minecraft/server";
import {
  FriendsDatabase,
  SavedServersDatabase,
  UsernameDatabase,
} from "../constants";

export default class UsernameLogger {
  private constructor() {}

  public static OnJoin(event: PlayerJoinAfterEvent): void {
    const { playerId: id, playerName: name } = event;

    UsernameDatabase.Set(id, name);

    if (!SavedServersDatabase.Has(id)) {
      SavedServersDatabase.Set(id, []);
    }
    if (!FriendsDatabase.Has(id)) {
      FriendsDatabase.Set(id, []);
    }
  }
}
