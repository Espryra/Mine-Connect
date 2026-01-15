import { type JoinedHistoryServer, type Server } from "./types/server";
import Database from "./utils/database";

export const ServersDatabase = new Database<Server>("servers");
export const SavedServersDatabase = new Database<string[]>("saved-servers");
export const FriendsDatabase = new Database<string[]>("friends");
export const FriendRequestsDatabase = new Database<string[]>("friend-requests");
export const UsernameDatabase = new Database<string>("usernames");
export const JoinedHistoryDatabase = new Database<JoinedHistoryServer>(
  "joined-history"
);
