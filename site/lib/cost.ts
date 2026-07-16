/** Haiku 4.5 list prices, USD per million tokens (cache write 1.25x, read 0.1x). */
export const PRICE = { input: 1, cacheWrite: 1.25, cacheRead: 0.1, output: 5 };

/** Dollar cost of one /api/chat call, from the Anthropic usage block (SPEC §6 spend gate). */
export function costUsd(u: {
  input_tokens: number;
  output_tokens: number;
  cache_creation_input_tokens?: number | null;
  cache_read_input_tokens?: number | null;
}): number {
  return (
    (u.input_tokens * PRICE.input +
      (u.cache_creation_input_tokens ?? 0) * PRICE.cacheWrite +
      (u.cache_read_input_tokens ?? 0) * PRICE.cacheRead +
      u.output_tokens * PRICE.output) /
    1_000_000
  );
}
