import { world } from "@minecraft/server";

export default class Database<T> {
  public constructor(public readonly name: string) {}

  public Get(key: string): T | null {
    const data = world.getDynamicProperty(this.FormatKey(key));

    return data ? JSON.parse(data as string) : null;
  }
  public Set(key: string, value?: Partial<T>): void {
    world.setDynamicProperty(
      this.FormatKey(key),
      value !== undefined ? JSON.stringify(value) : undefined
    );
  }
  public Has(key: string): boolean {
    return this.Get(key) !== null;
  }
  public Keys(): string[] {
    return world
      .getDynamicPropertyIds()
      .filter((id) => id.startsWith(this.name))
      .map((id) => id.replace(this.name + ":", ""));
  }
  public Values(): T[] {
    return Object.values(this.Entries());
  }
  public Entries(): Record<string, T> {
    const record = {} as Record<string, T>;

    for (const key of this.Keys()) {
      record[key] = this.Get(key)!;
    }

    return record;
  }

  private FormatKey(key: string): string {
    return this.name + ":" + key;
  }
}
