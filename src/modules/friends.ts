import { world, type Player } from "@minecraft/server";
import { ActionFormData, ModalFormData } from "@minecraft/server-ui";
import {
  FriendRequestsDatabase,
  FriendsDatabase,
  JoinedHistoryDatabase,
  ServersDatabase,
  UsernameDatabase,
} from "../constants";
import type { Friend } from "../types/friends";
import Formatter from "../utils/formatter";
import Menu from "./menu";

export default class Friends {
  private constructor() {}

  public static async MainMenu(player: Player): Promise<void> {
    const friends = this.GetFriends(player.id);
    const form = new ActionFormData()
      .title("§l§1Friends Menu")
      .body(
        [
          `Hello, §b${player.name}§r!\n`,
          `Friends - ${friends.length}\n`,
          `What would you like to do?\n\n`,
        ].join("\n")
      )
      .button(
        "§l§1Add Friend\n§r§7[ §bAdd a Friend §7]",
        "textures/ui/color_plus"
      )
      .button(
        "§l§1View Requests\n§r§7[ §bView Friend Requests §7]",
        "textures/ui/mail_icon"
      );

    for (const friend of friends) {
      form.button(
        `§l§1${friend.username}\n§r§7[ §bView Friend §7]`,
        "textures/ui/icon_steve"
      );
    }

    const response = await form.show(player);

    if (response.selection === undefined) {
      return;
    }
    if (response.selection === 0) {
      this.AddFriendMenu(player);
      return;
    }
    if (response.selection === 1) {
      this.ViewRequestsMenu(player);
      return;
    }

    const friend = friends[response.selection - 2];

    if (friend === undefined) {
      return;
    }

    this.ManageFriendMenu(player, friend);
  }
  public static async ManageFriendMenu(
    player: Player,
    friend: Friend
  ): Promise<void> {
    const lastPlayed = JoinedHistoryDatabase.Get(friend.entity_id);
    const server = ServersDatabase.Get(lastPlayed?.id ?? "");
    const status = !lastPlayed
      ? "§cNo History"
      : !server
      ? "§cUnknown Server"
      : server.name;

    const form = await new ActionFormData()
      .title("§l§1Friend Menu")
      .body(
        [
          `Hello, §b${player.name}§r!\n`,
          `Friend - ${friend.username}`,
          `Last Played - ${status} ${
            lastPlayed
              ? `§r| §b${Formatter.Time(
                  Math.floor(
                    (new Date().getTime() -
                      new Date(lastPlayed.joined).getTime()) /
                      (1000 * 60)
                  ),
                  true
                )}`
              : ""
          }\n§r`,
          `What would you like to do?\n\n`,
        ].join("\n")
      )
      .button(
        "§l§1Join Last Played\n§r§7[ §bJoin Last Played Server §7]",
        "textures/ui/dressing_room_customization"
      )
      .button(
        "§l§1Remove Friend\n§r§7[ §bRemove Friend §7]",
        "textures/ui/ErrorGlyph"
      )
      .show(player);

    switch (form.selection) {
      case undefined:
        break;

      case 0:
        if (!lastPlayed) {
          player.sendError("This player has never joined a server before!");
          break;
        }
        if (!server) {
          player.sendError("Could not find the last played server!");
          break;
        }

        Menu.JoinServer(player, server, lastPlayed.id);
        break;
      case 1:
        this.RemoveFriendMenu(player, friend);
        break;
    }
  }

  public static async AddFriendMenu(player: Player): Promise<void> {
    const target = await this.SearchPlayerMenu(player);

    if (target === null) {
      return;
    }
    if (target.entity_id === player.id) {
      player.sendError("You cannot add yourself as a friend!");
      return;
    }

    const friends = this.GetFriends(player.id);
    const requests = this.GetRequests(player.id);
    const targetsRequests = this.GetRequests(target.entity_id);

    if (friends.some((friend) => friend.entity_id === target.entity_id)) {
      player.sendError("You are already friends with this player!");
      return;
    }
    if (targetsRequests.some((request) => request.entity_id === player.id)) {
      player.sendError(
        "You have already sent a friend request to this player!"
      );
      return;
    }
    if (requests.some((request) => request.entity_id === target.entity_id)) {
      const index = requests.findIndex(
        (request) => request.entity_id === target.entity_id
      );

      if (index === -1) {
        player.sendError("Error while adding friend!");
        return;
      }

      requests.splice(index, 1);
      friends.push(target);
      FriendRequestsDatabase.Set(
        player.id,
        requests.map((request) => request.entity_id)
      );
      FriendsDatabase.Set(
        player.id,
        friends.map((friend) => friend.entity_id)
      );

      const targetPlayer = world
        .getAllPlayers()
        .find((player) => player.id === target.entity_id);

      player.sendSuccess(`You are now friends with ${target.username}!`);
      targetPlayer?.sendSuccess(`You are now friends with ${player.name}!`);
    }

    targetsRequests.push({
      entity_id: player.id,
      username: player.name,
    });
    FriendRequestsDatabase.Set(
      target.entity_id,
      targetsRequests.map((request) => request.entity_id)
    );

    const targetPlayer = world
      .getAllPlayers()
      .find((player) => player.id === target.entity_id);

    player.sendSuccess(`You have sent a friend request to ${target.username}!`);
    targetPlayer?.sendSuccess(`${player.name} has sent you a friend request!`);
  }
  public static async RemoveFriendMenu(
    player: Player,
    friend: Friend
  ): Promise<void> {
    const form = await new ActionFormData()
      .title("§l§1Remove Friend")
      .body(
        [
          `Hello, §b${player.name}§r!\n`,
          `Friend - ${friend.username}\n`,
          `Are you sure you would like to remove this friend?\n\n`,
        ].join("\n")
      )
      .button("§l§2Yes\n§r§7[ §bRemove Friend §7]", "textures/ui/confirm")
      .button("§l§4No\n§r§7[ §bCancel §7]", "textures/ui/cancel")
      .show(player);

    const friends = this.GetFriends(player.id);
    const targetFriends = this.GetFriends(friend.entity_id);

    switch (form.selection) {
      case undefined:
        break;
      case 0:
        FriendsDatabase.Set(
          player.id,
          friends
            .filter((entry) => entry.entity_id !== friend.entity_id)
            .map((friend) => friend.entity_id)
        );
        FriendsDatabase.Set(
          friend.entity_id,
          targetFriends
            .filter((entry) => entry.entity_id !== player.id)
            .map((friend) => friend.entity_id)
        );

        const targetPlayer = world
          .getAllPlayers()
          .find((player) => player.id === friend.entity_id);

        player.sendSuccess(`You have removed ${friend.username} as a friend!`);
        targetPlayer?.sendError(`${player.name} has removed you as a friend!`);
        break;
      case 1:
        player.sendSuccess(
          `You have cancelled the removal of ${friend.username} as a friend!`
        );
        break;
    }
  }

  public static async ViewRequestsMenu(player: Player): Promise<void> {
    const requests = this.GetRequests(player.id);

    if (requests.length === 0) {
      player.sendError("You have no friend requests!");
      return;
    }

    const form = new ActionFormData()
      .title("§l§1Friend Requests")
      .body(
        `Hello, §b${player.name}§r!\n\nRequests - ${requests.length}\n\nPlease select a request down below!\n\n`
      );

    for (const request of requests) {
      form.button(
        `§l§1${request.username}\n§r§7[ §bManage Request §7]`,
        "textures/ui/mail_icon"
      );
    }

    const response = await form.show(player);

    if (response.selection === undefined) {
      return;
    }

    const request = requests[response.selection]!;

    this.ManageRequestMenu(player, request);
  }
  public static async ManageRequestMenu(
    player: Player,
    request: Friend
  ): Promise<void> {
    const form = await new ActionFormData()
      .title("§l§1Friend Request Menu")
      .body(
        `Hello, §b${player.name}§r!\n\nRequester - ${request.username}\n\nWhat would you like to do?\n\n`
      )
      .button(
        "§l§2Accept\n§r§7[ §bAccept Friend Request §7]",
        "textures/ui/confirm"
      )
      .button(
        "§l§4Decline\n§r§7[ §bDecline Friend Request §7]",
        "textures/ui/cancel"
      )
      .show(player);

    const requests = this.GetRequests(player.id);
    const friends = this.GetFriends(player.id);
    const targetFriends = this.GetFriends(request.entity_id);

    switch (form.selection) {
      case undefined:
        break;
      case 0:
        const index = requests.findIndex(
          (entry) => entry.entity_id === request.entity_id
        );

        if (index === -1) {
          player.sendError("Error while accepting friend request!");
          return;
        }

        requests.splice(index, 1);
        FriendRequestsDatabase.Set(
          player.id,
          requests.map((request) => request.entity_id)
        );

        friends.push({
          entity_id: request.entity_id,
          username: request.username,
        });
        targetFriends.push({
          entity_id: player.id,
          username: player.name,
        });

        FriendsDatabase.Set(
          player.id,
          friends.map((friend) => friend.entity_id)
        );
        FriendsDatabase.Set(
          request.entity_id,
          targetFriends.map((friend) => friend.entity_id)
        );

        const targetPlayer = world
          .getAllPlayers()
          .find((player) => player.id === request.entity_id);

        player.sendSuccess(
          `You have accepted the friend request from ${request.username}!`
        );
        targetPlayer?.sendSuccess(
          `${player.name} has accepted your friend request!`
        );
        break;
      case 1: {
        const index = requests.findIndex(
          (entry) => entry.entity_id === request.entity_id
        );

        if (index === -1) {
          player.sendError("Error while denying friend request!");
          return;
        }

        requests.splice(index, 1);
        FriendRequestsDatabase.Set(
          player.id,
          requests.map((request) => request.entity_id)
        );

        const targetPlayer = world
          .getAllPlayers()
          .find((player) => player.id === request.entity_id);

        player.sendSuccess(
          `You have declined the friend request from ${request.username}!`
        );
        targetPlayer?.sendError(
          `${player.name} has declined your friend request!`
        );
        break;
      }
    }
  }

  public static GetFriends(entity_id: string): Friend[] {
    const friends = FriendsDatabase.Get(entity_id);

    if (friends === null) {
      return [];
    }

    return friends
      .map((friend) => {
        return {
          entity_id: friend,
          username: UsernameDatabase.Get(friend)!,
        };
      })
      .filter((friend) => friend.username !== null);
  }
  public static GetRequests(entity_id: string): Friend[] {
    const requests = FriendRequestsDatabase.Get(entity_id);

    if (requests === null) {
      return [];
    }

    return requests
      .map((entry) => {
        return {
          entity_id: entry,
          username: UsernameDatabase.Get(entry)!,
        };
      })
      .filter((entry) => entry.username !== null);
  }
  public static async SearchPlayerMenu(player: Player): Promise<Friend | null> {
    const form = await new ModalFormData()
      .title("§l§1Search Player Menu")
      .label(
        `Hello, §b${player.name}§r!\n\nPlease enter the player's username you would like to search down below!\n`
      )
      .textField("Player's Username", "", {
        tooltip: "This username does not need to be fully typed out.",
      })
      .show(player);

    if (!form.formValues) {
      return null;
    }

    const entered = form.formValues[1] as string;
    const filtered = Object.entries(UsernameDatabase.Entries()).filter(
      ([_, value]) => value.toLowerCase().includes(entered.toLowerCase())
    );

    if (filtered.length === 0) {
      player.sendError("No players found!");
      return null;
    }

    const selectionForm = new ActionFormData()
      .title(`§l§g${filtered.length} §1Players Found`)
      .body(
        `Hello, §b${player.name}§r!\n\nPlease select a player down below!\n`
      );

    for (const [_, username] of filtered) {
      selectionForm.button(
        `${username}§r\n§7[ §bView Player §7]`,
        "textures/ui/icon_steve"
      );
    }
    const selectionFormResult = await selectionForm.show(player);

    if (selectionFormResult.selection === undefined) {
      return null;
    }

    const [entity_id, username] = filtered[selectionFormResult.selection]!;

    return {
      entity_id,
      username,
    };
  }
}
