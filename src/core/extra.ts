import { useEffect, useRef } from "react";
import type { Machine } from "./types";

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
      ...o2,
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
 * Interface for a console object.
 */
export type ConsoleInterface = {
  /**
   * Logs a message to the console.
   *
   * @param format A `printf`-like format string.
   * @param param The parameter to log.
   */
  readonly log: (format: string, param: string | object) => void;
  /**
   * Increases indentation of subsequent lines by spaces for `groupIndentation`length.
   *
   * @param label If one or more `label`s are provided, those are printed first without the additional indentation.
   */
  readonly group?: ((...label: string[]) => void) | undefined;
  /**
   * An alias for {@link group}.
   */
  readonly groupCollapsed?: ((...label: string[]) => void) | undefined;
  /**
   * Decreases indentation of subsequent lines by spaces for `groupIndentation`length.
   */
  readonly groupEnd?: (() => void) | undefined;
};

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
 * Creates a initial machine state.
 *
 * @param definition machine definition.
 * @returns initial machine state.
 */
export function createInitialState(
  definition: Machine.Definition.Impl,
): Machine.State.Impl {
  const nextEvents = R.keys(
    R.concat(
      R.fromMaybe(R.get(definition.states, definition.initial)!.on),
      R.fromMaybe(definition.on),
    ),
  );

  return {
    event: { type: "$$initial" } as Machine.Event.Impl,
    value: definition.initial,
    context: definition.context as Machine.Context.Impl,
    nextEvents: nextEvents,
    nextEventsT: nextEvents,
  };
}

/**
 * The action to dispatch to the reducer.
 */
export type ReducerAction =
  | {
      type: "SET_CONTEXT";
      updater: Machine.ContextUpdater.Impl;
    }
  | {
      type: "SEND";
      sendable: Machine.Sendable.Impl;
    };

/**
 * Creates a reducer for the machine.
 *
 * @param definition machine definition.
 * @returns machine reducer.
 */
export function createReducer(definition: Machine.Definition.Impl) {
  function log(
    groupLabel: string,
    ...nested: [string, string | object][]
  ): void {
    if (__DEV__) {
      if (!definition.verbose) {
        return;
      }

      const console_ = definition.console || console;
      const collapse =
        !!(console_.groupCollapsed || console_.group) && !!console_.groupEnd;

      if (collapse) {
        (console_.groupCollapsed || console_.group)?.(
          "%cuseStateMachine",
          "color: #888; font-weight: lighter;",
          groupLabel,
        );
      }

      for (const message of nested) {
        console_.log(message[0], message[1]);
      }

      if (collapse) {
        console_.groupEnd?.();
      }
    }
  }

  return (
    state: Machine.State.Impl,
    reducerAction: ReducerAction,
  ): Machine.State.Impl => {
    switch (reducerAction.type) {
      case "SEND": {
        const sendable = reducerAction.sendable;
        const event =
          typeof sendable === "string" ? { type: sendable } : sendable;
        const context = state.context;
        const stateNode = R.get(definition.states, state.value)!;
        const resolvedTransition =
          R.get(R.fromMaybe(stateNode.on), event.type) ??
          R.get(R.fromMaybe(definition.on), event.type);

        if (!resolvedTransition) {
          if (__DEV__) {
            log(
              `Current state doesn't listen to event type "${event.type}".`,
              ["Current State", state],
              ["Event", event],
            );
          }

          return state;
        }

        const [nextStateValue, didGuardDeny = false] = (() => {
          if (typeof resolvedTransition === "string") {
            return [resolvedTransition];
          }

          if (
            resolvedTransition.guard === undefined ||
            resolvedTransition.guard({ context, event })
          ) {
            return [resolvedTransition.target];
          }

          return [resolvedTransition.target, true];
        })();

        if (didGuardDeny) {
          if (__DEV__) {
            log(
              `Transition from "${state.value}" to "${nextStateValue}" denied by guard`,
              ["Event", event],
              ["Context", context],
            );
          }

          return state;
        }

        if (__DEV__) {
          log(`Transition from "${state.value}" to "${nextStateValue}"`, [
            "Event",
            event,
          ]);
        }

        const resolvedStateNode = R.get(definition.states, nextStateValue)!;
        const nextEvents = R.keys(
          R.concat(
            R.fromMaybe(resolvedStateNode.on),
            R.fromMaybe(definition.on),
          ),
        );

        return {
          event,
          value: nextStateValue,
          context,
          nextEvents,
          nextEventsT: nextEvents,
        };
      }

      case "SET_CONTEXT": {
        const nextContext = reducerAction.updater(state.context);

        if (__DEV__) {
          log(
            "Context update",
            ["Previous Context", state.context],
            ["Next Context", nextContext],
          );
        }

        return {
          ...state,
          context: nextContext,
        };
      }

      default:
        throw new Error(`Unknown action type: ${(reducerAction as any).type}`);
    }
  };
}

/**
 * Hook to use a state machine.
 *
 * @param definition Machine definition.
 * @param state Machine state.
 * @param dispatch Dispatch function.
 * @returns State and send function.
 */
export function useMachine(
  definition: Machine.Definition.Impl,
  state: Machine.State.Impl,
  dispatch: (action: ReducerAction) => void,
) {
  const send = useConstant(
    () =>
      function send(sendable: Machine.Sendable.Impl) {
        dispatch({
          type: "SEND",
          sendable,
        });
      },
  );

  // biome-ignore lint/correctness/useExhaustiveDependencies: ignore
  useEffect(() => {
    function setContext(updater: Machine.ContextUpdater.Impl) {
      dispatch({
        type: "SET_CONTEXT",
        updater,
      });

      return { send };
    }

    const { effect } = R.get(definition.states, state.value) || {};
    const cleanup = effect?.({
      send,
      event: state.event,
      context: state.context,
      setContext,
    });

    return typeof cleanup === "function"
      ? () => {
          cleanup?.({
            send,
            event: state.event,
            context: state.context,
            setContext,
          });
        }
      : undefined;
  }, [state.value, state.event]);

  return [state, send];
}
