import { useRef } from "react";

export namespace R {
  /**
   * Get the value of a key in an object.
   * 
   * @template O The object type.
   * @param o The object from which to retrieve the value.
   * @param k The key whose value is to be retrieved.
   * @returns The value of the key, or `undefined` if the key does not exist.
   */
  export function get<O extends R.Unknown>(
    o: O,
    k: R.Key<O>,
  ): R.Value<O> | undefined {
    return (o as any)[k];
  }

  /**
   * Concatenates two objects.
   * 
   * @template O1 The first object type.
   * @template O2 The second object type.
   * @param o1 The first object to concatenate.
   * @param o2 The second object to concatenate.
   * @returns The concatenated object resulting from merging the properties of o1 and o2.
   */
  export function concat<O1 extends R.Unknown, O2 extends R.Unknown>(
    o1: O1,
    o2: O2,
  ): R.Concat<O1, O2> {
    return {
      ...o1,
      ...o2
    };
  }

  /**
   * Returns the value of an object, or an empty object type as `O` if the object is `undefined`.
   * 
   * @template O The object type.
   * @param o The object to return, or `undefined`.
   * @returns 
   */
  export function fromMaybe<O extends R.Unknown>(o: O | undefined): O {
    return o ?? ({} as O);
  }

  /**
   * Returns the keys of an object.
   * 
   * @template O The object type.
   * @param o The object from which to retrieve the keys.
   * @returns An array of the keys of the object.
   */
  export function keys<O extends R.Unknown>(o: O): R.Key<O>[] {
    return Object.keys(o);
  }

  declare const _$$K: unique symbol;
  declare const _$$V: unique symbol;

  /**
   * A type that represents the key of a key-value pair.
   */
  export type $$K = typeof _$$K;

  /**
   * A type that represents the value of a key-value pair.
   */
  export type $$V = typeof _$$V;

  /**
   * A type that represents a key-value pair.
   * 
   * @template K The key type.
   * @template V The value type.
   */
  export type Of<K extends string, V> = { [_$$K]: K; [_$$V]: V };

  /**
   * A type that represents a key-value pair with unknown key.
   */
  export type Unknown = Of<string, unknown>;

  /**
   * Extracts the key type from a key-value pair.
   * 
   * @template O The key-value pair type.
   */
  export type Key<O extends R.Unknown> = O[$$K];

  /**
   * Extracts the value type from a key-value pair.
   * 
   * @template O The key-value pair type.
   */
  export type Value<O extends R.Unknown> = O[$$V];

  /**
   * Concatenates two key-value pairs.
   * 
   * @template O1 The first key-value pair type.
   * @template O2 The second key-value pair type.
   */
  export type Concat<O1 extends R.Unknown, O2 extends R.Unknown> = R.Of<
    R.Key<O1> | R.Key<O2>,
    R.Value<O1> | R.Value<O2>
  >;
}

/**
 * This React hook is used to memoize a value that is expensive to compute.
 * Similar to `useMemo`, but also does not have a dependency list and is computed only once, the first time.
 * 
 * @template T The type of the memoized value.
 * @param compute A function that computes the memoized value.
 * @returns The memoized value.
 */
export function useConstant<T>(compute: () => T): T {
  const ref = useRef<T | null>(null);

  if (ref.current === null) {
    ref.current = compute();
  }

  return ref.current;
}

/**
 * This function is used to assert that a value is never reached.
 * 
 * @param _value The value that is never reached.
 */
export function assertNever(_value: never): never {
  throw new Error("Invariant: assertNever was called");
}
