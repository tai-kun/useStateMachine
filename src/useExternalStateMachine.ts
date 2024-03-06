import createInitialState from "./core/createInitialState";
import processDispatch, { type Action } from "./core/processDispatch";
import { useEffect, useRef, useSyncExternalStore } from "./core/react";
import type { A, Machine } from "./core/src";
import useSingleton from "./core/useSingleton";
import useSync, { type Dispatchers } from "./core/useSync";

type CreateStateMachine = <const D extends Machine.Definition<D>>(
  definition: A.InferNarrowestObject<D>,
) => Machine.External<D>;

export type UseExternalStateMachine = <
  const M extends {
    readonly getState: any;
    readonly send: any;
  },
>(
  machine: M,
) => [state: ReturnType<M["getState"]>, send: M["send"]];

function create(def: Machine.Definition.Impl): Machine.External.Impl {
  let state = createInitialState(def);
  const callbacks = new Set<(state: Machine.State.Impl) => void>();

  function dispatch(action: Action) {
    const nextState = processDispatch(def, state, action);

    if (!Object.is(nextState, state)) {
      state = nextState;

      for (const callback of callbacks) {
        callback(state);
      }
    }
  }

  function send(sendable: Machine.Sendable.Impl) {
    dispatch({
      type: "SEND",
      payload: sendable,
    });
  }

  return {
    def,
    send,
    getState: () => state,
    subscribe(callback: (state: Machine.State.Impl) => void) {
      callbacks.add(callback);

      return () => {
        callbacks.delete(callback);
      };
    },
    setContext(updater: Machine.ContextUpdater.Impl) {
      dispatch({
        type: "SET_CONTEXT",
        payload: updater,
      });

      return { send };
    },
  };
}

function useExternalStateMachine(machine: Machine.External.Impl) {
  const isMounted = useRef(false);

  useEffect(() => {
    isMounted.current = true;

    return () => {
      isMounted.current = false;
    };
  }, []);

  const state = useSyncExternalStore(
    machine.subscribe,
    machine.getState,
    machine.getState,
  );
  const dispatchers = useSingleton<Dispatchers>(() => {
    function send(sendable: Machine.Sendable.Impl) {
      if (isMounted.current) {
        machine.send(sendable);
      }
    }

    return {
      send,
      setContext(updater) {
        if (isMounted.current) {
          machine.setContext(updater);
        }

        return { send };
      },
    };
  });

  useSync(machine.def, state, dispatchers);

  return [state, dispatchers.send];
}

export { type CreateStateMachine };

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
export const createStateMachine = create as unknown as CreateStateMachine;

/**
 * Hook to use a state machine.
 *
 * Similar to `useStateMachine`, but uses `React.useSyncExternalStore` instead of `React.useState` to manage state.
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

export { t } from "./core/util";
