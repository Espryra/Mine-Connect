import type { Vector3 } from "@minecraft/server";

export default class Formatter {
  public static ToShort(number: number): string {
    const truncate = (value: number) =>
      (Math.floor(value * 10) / 10).toString().replace(/\.0$/, "");

    switch (true) {
      case number >= 1_000_000_000_000:
        return truncate(number / 1_000_000_000_000) + "T";
      case number >= 1_000_000_000:
        return truncate(number / 1_000_000_000) + "B";
      case number >= 1_000_000:
        return truncate(number / 1_000_000) + "M";
      case number >= 1_000:
        return truncate(number / 1_000) + "K";
      default:
        return number.toString();
    }
  }

  public static ToComma(number: number): string {
    return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }

  public static ToLocation(text: string): Vector3 {
    const [x, y, z] = text.split(" ");

    if (x === undefined || y === undefined || z === undefined) {
      return { x: 0, y: 0, z: 0 };
    }

    return {
      x: Number(x),
      y: Number(y),
      z: Number(z),
    };
  }

  public static ToExpiration(text: string): Date {
    let milliseconds = 0;

    if (text.length === 0) {
      return new Date();
    }

    const pieces = text.split(", ");

    for (const piece of pieces) {
      switch (true) {
        case piece.endsWith("d"):
          milliseconds += 86400000 * Number(piece.replace("d", ""));
          break;
        case piece.endsWith("h"):
          milliseconds += 3600000 * Number(piece.replace("h", ""));
          break;
        case piece.endsWith("m"):
          milliseconds += 60000 * Number(piece.replace("m", ""));
          break;
        case piece.endsWith("s"):
          milliseconds += 1000 * Number(piece.replace("s", ""));
          break;
      }
    }

    return new Date(Date.now() + milliseconds);
  }

  public static ReverseExpiration(date: Date | string): string {
    const parts: string[] = [];
    const offset = new Date(date).getTime() - Date.now();

    if (offset <= 0) {
      return "";
    }

    let seconds = Math.floor(offset / 1000);
    let minutes = Math.floor(seconds / 60);
    let hours = Math.floor(minutes / 60);
    let days = Math.floor(hours / 24);

    seconds = seconds % 60;
    minutes = minutes % 60;
    hours = hours % 24;

    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    if (seconds > 0) parts.push(`${seconds}s`);

    return parts.join(", ");
  }

  public static ReadableTypeId(typeId: string): string {
    const base = typeId.split(":")[1];

    if (!base) {
      return typeId;
    }

    return base
      .split("_")
      .map((word) => word[0]!.toUpperCase() + word.slice(1))
      .join(" ");
  }

  public static Time(time: number, short: boolean = false): string {
    let minutes = time;

    const weeks = Math.floor(minutes / 10080); // 7*24*60
    minutes %= 10080;

    const days = Math.floor(minutes / 1440); // 24*60
    minutes %= 1440;

    const hours = Math.floor(minutes / 60);
    minutes %= 60;

    const segments: string[] = [];
    if (weeks > 0) segments.push(`${weeks}w`);
    if (days > 0) segments.push(`${days}d`);
    if (hours > 0) segments.push(`${hours}h`);
    if (minutes > 0) segments.push(`${minutes}m`);

    // If nothing, return "0m"
    if (segments.length === 0) return "0m";

    // SHORT VERSION → only biggest two segments
    if (short) {
      return segments.slice(0, 2).join(" ");
    }

    // FULL VERSION → return all segments
    return segments.join(" ");
  }
}
