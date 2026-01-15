import {
  ItemLockMode,
  ItemStack,
  system,
  world,
  type Player,
} from "@minecraft/server";
import Config from "../lib/config";

export default class Inventory {
  private constructor() {}

  public static async Init(): Promise<void> {
    this.Loop();
  }
  public static SetInventory(player: Player): void {
    const container = player.getComponent("inventory")?.container;

    if (!container) {
      return;
    }

    const barrier = new ItemStack("minecraft:barrier");
    barrier.nameTag = "§l§cDisabled Slot";
    barrier.lockMode = ItemLockMode.slot;
    const glass = new ItemStack("minecraft:light_gray_stained_glass_pane");
    glass.nameTag = "§l§cDisabled Slot";
    glass.lockMode = ItemLockMode.slot;
    const menu = new ItemStack(Config.menu_item_typeid);
    menu.nameTag = "§l§1Mine Connect Menu";
    menu.lockMode = ItemLockMode.slot;

    for (let i = 9; i < container.size; i++) {
      container.setItem(i, barrier);
    }
    for (let i = 0; i < 9; i++) {
      container.setItem(i, glass);
    }

    container.setItem(4, menu);
  }

  private static Loop(): void {
    system.runInterval(() => {
      for (const player of world.getAllPlayers()) {
        if (player.hasTag(Config.admin_tag)) {
          continue;
        }

        this.SetInventory(player);
      }
    }, 20);
  }
}
