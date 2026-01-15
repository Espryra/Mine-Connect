import { world } from "@minecraft/server";
import UsernameLogger from "./assets/usernameLogger";
import Menu from "./modules/menu";

world.afterEvents.playerJoin.subscribe((event) => {
  UsernameLogger.OnJoin(event);
});
world.afterEvents.itemUse.subscribe((event) => {
  Menu.OnUse(event);
});
