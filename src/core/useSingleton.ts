import { useRef } from "./react";

/**
 * This React hook is used to memoize a value that is expensive to compute.
 * Similar to `useMemo`, but also does not have a dependency list and is computed only once, the first time.
 *
 * @template T The type of the memoized value.
 * @param compute A function that computes the memoized value.
 * @returns The memoized value.
 */
export default function useSingleton<T extends object>(compute: () => T): T {
  const ref = useRef<T | null>(null);

  if (ref.current === null) {
    ref.current = compute();
  }

  return ref.current;
}
