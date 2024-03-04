import { useEffect, useRef, useSyncExternalStore } from "react";
import type { Machine, A } from "./types";
import {
  type ReducerAction,
  createInitialState,
  createReducer,
  useMachine,
  useConstant,
} from "./misc";

export type CreateStateMachine = <const D extends Machine.Definition<D>>(
  definition: A.InferNarrowestObject<D>,
) => Machine<D>;

export type UseExternalStateMachine = <const D extends Machine.Definition<D>>(
  machine: Machine<D>,
) => [
  state: Machine.State<Machine.Definition.FromTypeParamter<D>>,
  send: Machine.Send<Machine.Definition.FromTypeParamter<D>>,
];

function $createStateMachine(definition: Machine.Definition.Impl): Machine {
  let state = createInitialState(definition);
  const update = createReducer(definition);
  const callbacks = new Set<(state: Machine.State.Impl) => void>();

  return [
    () => state,
    function dispatch(action: ReducerAction) {
      state = update(state, action);

      for (const callback of callbacks) {
        callback(state);
      }
    },
    (callback: (state: Machine.State.Impl) => void) => {
      callbacks.add(callback);

      return () => {
        callbacks.delete(callback);
      };
    },
    definition,
  ];
}

function useExternalStateMachine(machine: Machine) {
  const isMounted = useRef(false);
  const [getState, dispatch, subscribe, definition] = useConstant(() => {
    const [, dispatch] = machine;

    return [
      machine[0],
      function dispatchOnlyWhenMounted(action: ReducerAction) {
        if (isMounted.current) {
          dispatch(action);
        }
      },
      machine[2],
      machine[3],
    ];
  });
  const state = useSyncExternalStore(subscribe, getState, getState);

  useEffect(() => {
    isMounted.current = true;

    return () => {
      isMounted.current = false;
    };
  }, []);

  return useMachine(definition, state, dispatch);
}

/**
 * Hook to use a state machine.
 *
 * Similar to `useStateMachine`, but uses `React.useSyncExternalStore` instead of `React.useReducer` to manage state.
 *
 * ```ts
 * const machine = createStateMachine(
 *   // State Machine Definition
 * );
 * const [state, send] = useExternalStateMachine(machine);
 * ```
 *
 * @template D The type of the state machine definition.
 * @param machine A state machine object.
 * @returns An array with the current state and the send function.
 */
export default useExternalStateMachine as unknown as UseExternalStateMachine;

/**
 * Creates a state machine object.
 *
 * ```ts
 * const machine = createStateMachine(
 *   // State Machine Definition
 * );
 * ```
 *
 * @template D The type of the state machine definition.
 * @param definition The state machine definition.
 * @returns A state machine object.
 */
export const createStateMachine = $createStateMachine as CreateStateMachine;

export { t } from "./utils";
