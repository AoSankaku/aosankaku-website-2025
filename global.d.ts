declare module '*.yml' {
  const content: Record<string, string>;
  export default content;
}

declare module 'bun:test' {
  export const describe: any;
  export const expect: any;
  export const test: any;
}

interface String {
  /**
   * Converts Hiragana characters in the string to their corresponding Katakana characters.
   * @returns The converted string.
   */
  toKatakana(): string;
}
