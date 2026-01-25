

export function getKeyName(...args: string[]) {
    return `bites:${args.join(":")}`;
}

export const testKeyById = (id: string) => getKeyName("test", id);