import { type Dispatchers, processEffect } from "./logic";
import { useEffect, useInsertionEffect, useRef } from "./react";
import { $$tf, type Machine, type Transfer } from "./src";

/**
 * Checks if a value is a transferable value.
 *
 * @param value The value to check.
 * @returns `true` if the value is a transferable value, otherwise `false`.
 */
export function isTransfer(value: unknown): value is Transfer {
  return typeof value === "object" && value !== null && $$tf in value;
}

/**
 * Returns a state machine definition.
 *
 * @param arg0 The state machine definition or a function that creates a state machine definition.
 * @param args Arguments to pass to the state machine definition factory.
 * @returns The state machine definition.
 */
export function useDefinition(
  arg0: Machine.Definition.Impl | Machine.Impl,
  args: unknown[],
) {
  if (__DEV__) {
    const ref = useRef<unknown[]>();

    if (ref.current) {
      if (ref.current.length !== args.length) {
        throw new Error(
          "The number of arguments passed to state machine must not change.",
        );
      }

      ref.current.forEach((arg, i) => {
        if (isTransfer(arg) !== isTransfer(args[i])) {
          throw new Error(
            [
              "A state machine hook is changing ",
              `from a ${isTransfer(arg) ? "" : "non-"}transferable value `,
              `to a ${isTransfer(args[i]) ? "" : "non-"}transferable value `,
              `at index ${i} of the argument list.`,
              "Each transferable argument is transferred by useRef, ",
              "so their order and number cannot be changed.",
            ].join(""),
          );
        }
      });
    } else {
      ref.current = args;
    }
  }

  const params = args.map((arg) =>
    isTransfer(arg) ? useSyncedRef(arg.current) : arg,
  );

  return useSingleton(() =>
    typeof arg0 === "function" ? arg0(...params).def : arg0,
  );
}

/**
 * This React hook is used to memoize a value that is expensive to compute.
 * Similar to `useMemo`, but also does not have a dependency list and is computed only once, the first time.
 *
 * @template T The type of the memoized value.
 * @param compute A function that computes the memoized value.
 * @returns The memoized value.
 */
export function useSingleton<T extends object>(compute: () => T): T {
  const ref = useRef<T>();

  if (!ref.current) {
    ref.current = compute();
  }

  return ref.current;
}

export type { Dispatchers };

/**
 * A hook that synchronizes a state machine with the component lifecycle.
 *
 * @param def State machine definition.
 * @param state State machine state.
 * @param dispatchers State machine dispatchers.
 */
export function useSync(
  def: Machine.Definition.Impl,
  state: Machine.State.Impl,
  dispatchers: Dispatchers,
): void {
  useEffect(
    () => processEffect(def, state, dispatchers),
    [state.value, state.event],
  );
}

/**
 * A reference to an object.
 *
 * @template T The type of the object.
 */
export type SyncedRefObject<T = unknown> = {
  /**
   * The current value of the reference.
   */
  readonly current: T;
};

/**
 * Like `useRef`, but the `current` value is always in sync with the value passed to the hook.
 *
 * @param value The value of the reference.
 * @returns A reference to the value.
 */
export function useSyncedRef<T>(value: T): SyncedRefObject<T> {
  const ref = useRef(value);
  ref.current = value;

  return ref;
}

const useIsomorphicInsertionEffect =
  typeof document === "undefined" ? useEffect : useInsertionEffect;

/**
 * A hook that returns whether the component is mounted.
 *
 * @returns A reference to a boolean that is `true` if the component is mounted, otherwise `false`.
 */
export function useIsMounted(): { readonly current: boolean } {
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
  }, []);

  useIsomorphicInsertionEffect(
    () => () => {
      isMounted.current = false;
    },
    [],
  );

  return isMounted;
}
