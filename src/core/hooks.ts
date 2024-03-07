import { useRef } from "react";
import { type Dispatchers, processEffect } from "./logic";
import { useEffect } from "./react";
import type { Machine } from "./src";

export type CreateDefinitionImpl = {
  /**
   * Define a state machine to use with `useStateMachine` or `useSyncedStateMachine`.
   *
   * @param definition The state machine definition.
   * @returns The state machine definition.
   */
  (definition: Machine.Definition.Impl): Machine.Definition.Impl;
};

export type DefineWithoutPropsImpl = {
  /**
   * Define a state machine to use with `useStateMachine` or `useSyncedStateMachine`.
   *
   * @param create A function that creates a state machine definition.
   * @returns The state machine definition.
   */
  (create: CreateDefinitionImpl): Machine.Definition.Impl;
};

export type DefineWithPropsImpl = {
  /**
   * Define a state machine to use with `useStateMachine` or `useSyncedStateMachine`.
   *
   * @param props A reference to the props object.
   * @param create A function that creates a state machine definition.
   * @returns The state machine definition.
   */
  (
    props: SyncedRefObject,
    create: CreateDefinitionImpl,
  ): Machine.Definition.Impl;
};

/**
 * Returns a state machine definition.
 *
 * @param arg0 The state machine definition or a function that creates a state machine definition.
 * @param args Arguments to pass to the state machine definition factory.
 * @returns The state machine definition.
 */
export function useDefinition(
  arg0: Machine.Definition.Impl | Machine.Impl,
  ...args: [props?: unknown]
) {
  const props = useSyncedRef(args[0]);

  return useSingleton(() =>
    "new" in arg0
      ? args.length
        ? (arg0.new as DefineWithPropsImpl)(props, (d) => d)
        : (arg0.new as DefineWithoutPropsImpl)((d) => d)
      : arg0,
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
  const ref = useRef<T | null>(null);

  if (ref.current === null) {
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
 * @param value The initial value of the reference.
 * @returns A reference to the value.
 */
export function useSyncedRef<T>(value: T): SyncedRefObject<T> {
  const ref = useRef(value);
  ref.current = value;

  return ref;
}
