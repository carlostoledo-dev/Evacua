import type { esCL } from './dictionaries/es-CL.ts';

export type MessageKey = keyof typeof esCL;
export type Dictionary = Readonly<Record<MessageKey, string>>;
export type MessageParams = Readonly<Record<string, string | number>>;

const PLACEHOLDER = /\{(\w+)\}/g;

/** Looks up `key` and fills `{name}` placeholders. Unknown placeholders are left untouched. */
export function translate(dictionary: Dictionary, key: MessageKey, params?: MessageParams): string {
  const template = dictionary[key];
  if (!params) return template;
  return template.replace(PLACEHOLDER, (match, name: string) => {
    const value = params[name];
    return value === undefined ? match : String(value);
  });
}

/** Names of the `{placeholders}` used in a message, sorted. */
export function placeholdersOf(message: string): string[] {
  return [...message.matchAll(PLACEHOLDER)].map((m) => m[1] ?? '').sort();
}
