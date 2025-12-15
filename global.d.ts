declare module '*.yml' {
  const content: Record<string, string>;
  export default content;
}

interface String {
  /**
   * Converts Hiragana characters in the string to their corresponding Katakana characters.
   * @returns The converted string.
   */
  toKatakana(): string;
}