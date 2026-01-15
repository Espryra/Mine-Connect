import { world, type ItemUseAfterEvent, type Player } from "@minecraft/server";
import { transferPlayer } from "@minecraft/server-admin";
import { ActionFormData, ModalFormData } from "@minecraft/server-ui";
import {
  JoinedHistoryDatabase,
  SavedServersDatabase,
  ServersDatabase,
} from "../constants";
import Config from "../lib/config";
import type { Server } from "../types/server";
import ShuffleArray from "../utils/shuffleArray";
import UUID from "../utils/uuid";
import Friends from "./friends";

export default class Menu {
  public static OnUse(event: ItemUseAfterEvent): void {
    const { itemStack: item, source: player } = event;

    if (item.typeId !== Config.menu_item_typeid) {
      return;
    }
    if (player.hasTag(Config.admin_tag)) {
      this.AdminView(player);
      return;
    }

    this.MemberMenu(player);
  }

  public static async AdminView(player: Player): Promise<void> {
    const form = await new ActionFormData()
      .title("§l§1Mine Connect")
      .body(
        `Hello, §b${player.name}§r!\n\nPlease select a option down below!\n`
      )
      .button(
        "§l§5Minecart SMP\n§r§7[ §dJoin Minecart SMP §7]",
        "textures/items/minecart_normal"
      )
      .button(
        "§l§1Server List\n§r§7[ §bView All Servers §7]",
        "textures/items/book_written"
      )
      .button(
        "§l§1Join Any Server\n§r§7[ §bJoin Any MC Server §7]",
        "textures/items/book_writable"
      )
      .button(
        "§l§1Join Random Server\n§r§7[ §bJoin a Random Server §7]",
        "textures/items/recovery_compass_item"
      )
      .button(
        "§l§1My Servers\n§r§7[ §bView Your Saved Servers §7]",
        "textures/ui/absorption_heart"
      )
      .button(
        "§l§1Friends\n§r§7[ §bView Your Friends §7]",
        "textures/ui/dressing_room_skins"
      )
      .button(
        "§1§lSettings\n§r§7[ §bAdmin Only §7]",
        "textures/ui/settings_glyph_color_2x"
      )
      .button(
        "§4§lClose Menu\n§r§7[ §cClose the Menu §7]",
        "textures/ui/cancel"
      )
      .show(player);
    switch (form.selection) {
      case undefined:
        break;
      case 0:
        transferPlayer(player, {
          hostname: Config.featured_server_host,
          port: Config.featured_server_port,
        });
        break;
      case 1:
        this.ServerListMenu(player);
        break;
      case 2:
        this.JoinAnyMenu(player);
        break;
      case 3:
        this.RandomJoin(player);
        break;
      case 4:
        this.ViewSavedMenu(player);
        break;
      case 5:
        Friends.MainMenu(player);
        break;
      case 6:
        this.SettingsMenu(player);
        break;
      case 7:
        break;
    }
  }
  public static async MemberMenu(player: Player): Promise<void> {
    const form = await new ActionFormData()
      .title("§l§1Mine Connect")
      .body(
        `Hello, §b${player.name}§r!\n\nPlease select a option down below!\n`
      )
      .button(
        "§l§5Minecart SMP\n§r§7[ §dJoin Minecart SMP §7]",
        "textures/items/minecart_normal"
      )
      .button(
        "§l§1Server List\n§r§7[ §bView All Servers §7]",
        "textures/items/book_written"
      )
      .button(
        "§l§1Join Any Server\n§r§7[ §bJoin Any MC Server §7]",
        "textures/items/book_writable"
      )
      .button(
        "§l§1Join Random Server\n§r§7[ §bJoin a Random Server §7]",
        "textures/items/recovery_compass_item"
      )
      .button(
        "§l§1My Servers\n§r§7[ §bView Your Saved Servers §7]",
        "textures/ui/absorption_heart"
      )
      .button(
        "§l§1Friends\n§r§7[ §bView Your Friends §7]",
        "textures/ui/dressing_room_skins"
      )
      .button(
        "§4§lClose Menu\n§r§7[ §cClose the Menu §7]",
        "textures/ui/cancel"
      )
      .show(player);

    switch (form.selection) {
      case undefined:
        break;
      case 0:
        transferPlayer(player, {
          hostname: Config.featured_server_host,
          port: Config.featured_server_port,
        });
        break;
      case 1:
        this.ServerListMenu(player);
        break;
      case 2:
        this.JoinAnyMenu(player);
        break;
      case 3:
        this.RandomJoin(player);
        break;
      case 4:
        this.ViewSavedMenu(player);
        break;
      case 5:
        Friends.MainMenu(player);
        break;
      case 6:
        break;
    }
  }

  public static async ViewSavedMenu(player: Player): Promise<void> {
    const record: Record<string, Server> = {};
    const saved = SavedServersDatabase.Get(player.id);

    if (saved === null) {
      player.sendError("Could not get your saved servers!");
      return;
    }
    if (saved.length === 0) {
      player.sendError("You have no saved servers!");
      return;
    }

    for (const save of saved) {
      const data = ServersDatabase.Get(save);

      if (!data) {
        const index = saved.indexOf(save);

        if (index !== -1) {
          saved.splice(index, 1);
        }

        continue;
      }

      record[save] = data;
    }

    SavedServersDatabase.Set(player.id, saved);

    const form = new ActionFormData()
      .title("§l§1My Servers")
      .body(
        `Hello, §b${player.name}§r!\n\nPlease select a server down below!\n`
      );

    const mapped = Object.entries(record);

    for (const [name, data] of mapped) {
      form.button(`${data.name}§r\n§7[ ${data.subtext} §r§7]`, data.icon);
    }

    const result = await form.show(player);

    if (result.selection === undefined) {
      return;
    }

    const selection = mapped[result.selection]!;

    this.ManageSavedServerMenu(player, selection[1], selection[0]);
  }
  public static async ManageSavedServerMenu(
    player: Player,
    data: Server,
    id: string
  ): Promise<void> {
    const form = await new ActionFormData()
      .title("§l§1Manage Server")
      .body(
        [
          `Hello, §b${player.name}§r!\n`,
          `Here is the selected server's information:\n`,
          `IP - ${data.host}§r`,
          `Port - ${data.port}§r`,
          `Joins - ${data.joins}§r`,
          `Saves - ${this.GetSaves(id)}§r\n\n`,
          `What would you like to do with this server?\n`,
        ].join("\n")
      )
      .button(
        `§l§1Join Server\n§r§7[ §bJoin The Server §7]`,
        "textures/ui/icon_multiplayer"
      )
      .button(
        `§l§1Unsave Server\n§r§7[ §bUnsave The Server §7]`,
        "textures/ui/cancel"
      )
      .button(`§l§4Back\n§r§7[ §cPrevious Page §7]`, "textures/ui/icon_import")
      .show(player);

    switch (form.selection) {
      case undefined:
        break;
      case 0:
        transferPlayer(player, {
          hostname: data.host,
          port: data.port,
        });
        break;
      case 1:
        const request = this.UnsaveServer(player, data, id);

        if (request) {
          this.ViewSavedMenu(player);
          return;
        } else {
          player.sendError("Could not unsave the server!");
        }
        break;
      case 2:
        break;
    }
  }
  public static async JoinAnyMenu(player: Player): Promise<void> {
    const form = await new ModalFormData()
      .title("§l§1Add Server Menu")
      .label(
        `Hello, §b${player.name}§r!\n\nPlease enter the server's information you would like to add down below!\n`
      )
      .textField("Server's IP", `§o${Config.featured_server_host}`)
      .textField("Server's Port", `§o${Config.featured_server_port}`)
      .textField("Server's Name", `§oMinecart SMP`, {
        tooltip: "This name can include the section symbol for coloring.",
      })
      .textField("Server's Description", `Join Minecart SMP`, {
        tooltip:
          "This description can include the section symbol for coloring. This text will be shown below the name of the server.",
      })
      .textField("Server's Icon (Optional)", `textures/ui/emerald`, {
        tooltip: "This value must be a icon path.",
      })
      .show(player);

    if (!form.formValues) {
      return;
    }

    const ip = form.formValues[1] as string;
    const port = parseInt(form.formValues[2] as string);
    const name = form.formValues[3] as string;
    const description = form.formValues[4] as string;
    const icon = form.formValues[5] as string;

    if (
      ip.length === 0 ||
      isNaN(port) ||
      name.length === 0 ||
      description.length === 0
    ) {
      player.sendError("Invalid Input!");
      return;
    }

    const data: Server = {
      name,
      subtext: description,
      icon,
      host: ip,
      port,
      joins: 0,
      admin_made: false,
    };
    const id = UUID();
    const saved = SavedServersDatabase.Get(player.id);

    if (saved === null) {
      SavedServersDatabase.Set(player.id, [id]);
    } else {
      saved.push(id);
      SavedServersDatabase.Set(player.id, saved);
    }

    ServersDatabase.Set(id, data);
    player.sendSuccess("Successfully added the server to your saved servers!");
  }

  public static async SettingsMenu(player: Player): Promise<void> {
    const form = await new ActionFormData()
      .title("§l§1Settings Menu")
      .body(
        `Hello, §b${player.name}§r!\n\nPlease select a option down below!\n`
      )
      .button(
        "§l§1Add Server\n§r§7[ §bAdd a Server §7]",
        "textures/ui/color_plus"
      )
      .button(
        "§l§1Edit Server\n§r§7[ §bEdit a Server §7]",
        "textures/ui/settings_pause_menu_icon"
      )
      .button(
        "§l§1Remove Server\n§r§7[ §bRemove a Server §7]",
        "textures/blocks/barrier"
      )
      .button("§l§4Back\n§r§7[ §cPrevious Page §7]", "textures/ui/icon_import")
      .show(player);

    switch (form.selection) {
      case undefined:
        break;
      case 0:
        this.AddServerMenu(player);
        break;
      case 1:
        this.EditServerMenu(player);
        break;
      case 2:
        this.DeleteServerMenu(player);
        break;
      case 3:
        this.AdminView(player);
        break;
    }
  }
  public static async AddServerMenu(player: Player): Promise<void> {
    const form = await new ModalFormData()
      .title("§l§1Add Server Menu")
      .label(
        `Hello, §b${player.name}§r!\n\nPlease enter the server's information you would like to add down below!\n`
      )
      .textField("Server's IP", `§o${Config.featured_server_host}`)
      .textField("Server's Port", `§o${Config.featured_server_port}`)
      .textField("Server's Name", `§oMinecart SMP`, {
        tooltip: "This name can include the section symbol for coloring.",
      })
      .textField("Server's Description", `Join Minecart SMP`, {
        tooltip:
          "This description can include the section symbol for coloring. This text will be shown below the name of the server.",
      })
      .textField("Server's Icon (Optional)", `textures/ui/emerald`, {
        tooltip: "This value must be a icon path.",
      })
      .show(player);

    if (!form.formValues) {
      return;
    }

    const ip = form.formValues[1] as string;
    const port = parseInt(form.formValues[2] as string);
    const name = form.formValues[3] as string;
    const description = form.formValues[4] as string;
    const icon = form.formValues[5] as string;

    if (
      ip.length === 0 ||
      isNaN(port) ||
      name.length === 0 ||
      description.length === 0
    ) {
      player.sendError("Invalid Input!");
      return;
    }

    const server: Server = {
      host: ip,
      port,
      name,
      subtext: description,
      icon: icon === "" ? undefined : icon,
      joins: 0,
      admin_made: true,
    };

    ServersDatabase.Set(UUID(), server);
    player.sendSuccess("Successfully added server!");
  }
  public static async EditServerMenu(player: Player): Promise<void> {
    const request = await this.SearchServerMenu(player);

    if (!request) {
      return;
    }

    const [id, data] = request;
    const form = await new ModalFormData()
      .label(
        `Hello, §b${player.name}§r!\n\nPlease change the server's information you would like to edit down below!\n`
      )
      .textField("Server's IP", `§o${data.host}`, {
        defaultValue: data.host,
      })
      .textField("Server's Port", `§o${data.port}`, {
        defaultValue: data.port.toString(),
      })
      .textField("Server's Name", `§o${data.name}`, {
        tooltip: "This name can include the section symbol for coloring.",
        defaultValue: data.name,
      })
      .textField("Server's Description", `§o${data.subtext}`, {
        tooltip:
          "This description can include the section symbol for coloring. This text will be shown below the name of the server.",
        defaultValue: data.subtext,
      })
      .textField("Server's Icon (Optional)", `textures/ui/emerald`, {
        tooltip: "This value must be a icon path.",
        defaultValue: data.icon,
      })
      .show(player);

    if (!form.formValues) {
      return;
    }

    const ip = form.formValues[1] as string;
    const port = parseInt(form.formValues[2] as string);
    const name = form.formValues[3] as string;
    const description = form.formValues[4] as string;
    const icon = form.formValues[5] as string;

    if (
      ip.length === 0 ||
      isNaN(port) ||
      name.length === 0 ||
      description.length === 0
    ) {
      player.sendError("Invalid Input!");
      return;
    }

    const server: Server = {
      host: ip,
      port,
      name,
      subtext: description,
      icon: icon === "" ? undefined : icon,
      joins: data.joins,
      admin_made: data.admin_made,
    };

    ServersDatabase.Set(id, server);
    player.sendSuccess("Successfully edited server!");
  }
  public static async DeleteServerMenu(player: Player): Promise<void> {
    const request = await this.SearchServerMenu(player);

    if (!request) {
      return;
    }

    const [id, data] = request;
    const saves = this.GetSaves(id);
    const form = await new ActionFormData()
      .title("§l§4Delete Server")
      .body(
        [
          `§cHello, §b${player.name}§c!\n`,
          `Are you sure you would like to delete this server?§r\n`,
          `Name - ${data.name}§r`,
          `Description - ${data.subtext}§r`,
          `IP - ${data.host}§r`,
          `Port - ${data.port}§r`,
          `Joins - ${data.joins}§r`,
          `Saves - ${saves}§r\n\n`,
        ].join("\n")
      )
      .button("§l§2Yes\n§r§7[ §cDelete Server §7]", "textures/ui/confirm")
      .button("§l§4No\n§r§7[ §cCancel §7]", "textures/ui/cancel")
      .show(player);

    if (form.selection !== 0) {
      return;
    }

    for (const [id, list] of Object.entries(SavedServersDatabase.Entries())) {
      if (list.includes(id)) {
        SavedServersDatabase.Set(
          id,
          list.filter((value) => value !== id)
        );
      }
    }

    ServersDatabase.Set(id);
    player.sendSuccess("Successfully deleted server!");
  }

  public static async ServerListMenu(player: Player): Promise<void> {
    const servers = ShuffleArray<[string, Server]>(
      Object.entries(ServersDatabase.Entries()).filter(
        ([_, value]) => value.admin_made
      )
    );

    if (servers.length === 0) {
      player.sendError("No servers found!");
      return;
    }

    const form = new ActionFormData()
      .title("§l§1Server List")
      .body(
        `Hello, §b${player.name}§r!\n\nPlease select a server down below!\n`
      )
      .button(
        "§l§1Search\n§r§7[ §bSearch for a Server §7]",
        "textures/ui/magnifyingGlass"
      );

    for (const [_, data] of servers) {
      form.button(`${data.name}§r\n§7[ ${data.subtext} §r§7]`, data.icon);
    }

    const result = await form.show(player);

    if (result.selection === undefined) {
      return;
    }
    if (result.selection === 0) {
      const server = await this.SearchServerMenu(player);

      if (server === null) {
        return;
      }

      this.ManageServerMenu(player, server[1], server[0]);
      return;
    }

    const selection = servers[result.selection - 1]!;

    this.ManageServerMenu(player, selection[1], selection[0]);
  }
  public static async ManageServerMenu(
    player: Player,
    data: Server,
    id: string
  ): Promise<void> {
    const saved = SavedServersDatabase.Get(player.id);

    if (saved === null) {
      player.sendError("Could not get your saved servers!");
      return;
    }

    const form = await new ActionFormData()
      .title(data.name)
      .body(
        [
          `Hello, §b${player.name}§r!\n`,
          `Here is the selected server's information:\n`,
          `IP - ${data.host}§r`,
          `Port - ${data.port}§r`,
          `Joins - ${data.joins}§r`,
          `Saves - ${this.GetSaves(id)}§r\n\n`,
          `What would you like to do with this server?\n`,
        ].join("\n")
      )
      .button(
        `§l§1Join Server\n§r§7[ §bJoin The Server §7]`,
        "textures/ui/icon_multiplayer"
      )
      .button(
        `§l§1Save Server\n§r§7[ §bSave The Server §7]`,
        "textures/ui/color_plus"
      )
      .button(
        `§l§1Save and Join  Server\n§r§7[ §bJoin And Save Server §7]`,
        "textures/ui/share_google"
      )
      .button("§l§4Back\n§r§7[ §cPrevious Page §7]", "textures/ui/icon_import")
      .show(player);

    switch (form.selection) {
      case undefined:
        break;
      case 0:
        this.JoinServer(player, data, id);
        break;
      case 1:
        const request = this.SaveServer(player, id);

        if (request) {
          player.sendSuccess("Successfully saved server!");
        } else {
          player.sendError(
            "Could not save server! This is more likely due to you already having the server saved."
          );
        }
        break;
      case 2:
        this.SaveServer(player, id);
        this.JoinServer(player, data, id);
        break;
      case 3:
        this.ServerListMenu(player);
        break;
    }
  }

  public static RandomJoin(player: Player): void {
    const servers = Object.entries(ServersDatabase.Entries()).filter(
      ([_, value]) => value.admin_made
    );
    const random = servers[Math.floor(Math.random() * servers.length)]!;

    this.JoinServer(player, random[1], random[0]);
  }
  public static UnsaveServer(
    player: Player,
    data: Server,
    id: string
  ): boolean {
    const saved = SavedServersDatabase.Get(player.id);

    if (saved === null) {
      return false;
    }

    const index = saved.indexOf(id);

    if (index !== -1) {
      saved.splice(index, 1);
      SavedServersDatabase.Set(player.id, saved);
    } else {
      return false;
    }
    if (!data.admin_made) {
      ServersDatabase.Set(id);
    }

    return true;
  }
  public static SaveServer(player: Player, id: string): boolean {
    const saved = SavedServersDatabase.Get(player.id);

    if (saved === null) {
      return false;
    }
    if (saved.includes(id)) {
      return false;
    }

    saved.push(id);
    SavedServersDatabase.Set(player.id, saved);

    return true;
  }
  public static JoinServer(player: Player, data: Server, id: string): void {
    const edited = {
      ...data,
      joins: data.joins + 1,
    } as Server;

    ServersDatabase.Set(id, edited);
    JoinedHistoryDatabase.Set(player.id, {
      id,
      joined: new Date(),
    });

    world.sendMessage(`§b${player.name}§r is joining ${data.name}§r!`);
    transferPlayer(player, {
      hostname: data.host,
      port: data.port,
    });
  }
  public static async SearchServerMenu(
    player: Player
  ): Promise<[string, Server] | null> {
    const form = await new ModalFormData()
      .title("§l§1Search Server Menu")
      .label(
        `Hello, §b${player.name}§r!\n\nPlease enter the server's name you would like to search down below!\n`
      )
      .textField("Server's Name", "Minecart SMP", {
        tooltip:
          "This name can include the section symbol for coloring. This name does not need to be fully typed out.",
      })
      .show(player);

    if (!form.formValues) {
      return null;
    }

    const name = form.formValues[1] as string;
    const filtered = Object.entries(ServersDatabase.Entries()).filter(
      ([_, value]) =>
        value.name.toLowerCase().includes(name.toLowerCase()) &&
        value.admin_made
    );

    if (filtered.length === 0) {
      player.sendError("No servers found!");
      return null;
    }

    const selectionForm = new ActionFormData()
      .title(`§l§g${filtered.length} §1Servers Found`)
      .body(
        `Hello, §b${player.name}§r!\n\nPlease select a server down below!\n`
      );

    for (const [_, server] of filtered) {
      selectionForm.button(
        `${server.name}§r\n§7[ ${server.subtext} §r§7]`,
        server.icon
      );
    }

    const selectionFormResult = await selectionForm.show(player);

    if (selectionFormResult.selection === undefined) {
      return null;
    }

    return filtered[selectionFormResult.selection] ?? null;
  }
  public static GetSaves(id: string): number {
    let total = 0;

    for (const list of SavedServersDatabase.Values()) {
      if (list.includes(id)) {
        total++;
      }
    }

    return total;
  }
}

/**
 * Notes:
 * Viewing servers should be in a random order.
 * Servers should have a joins count.
 * Servers should have a saves count.
 * Editing a server should have a search by name filter.
 */

/**
 * Options to add:
 * IP
 * Port
 * Name
 * Description
 * Icon (Path)
 *
 */
