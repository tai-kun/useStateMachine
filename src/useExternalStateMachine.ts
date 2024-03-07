import { useEffect, useRef, useSyncExternalStore } from "./core/react";
import type { Machine } from "./core/src";
import useSingleton from "./core/useSingleton";
import useSync, { type Dispatchers } from "./core/useSync";

type UseExternalStateMachine = {
  <const M extends { getState: any; send: any }>(
    machine: M,
  ): [state: ReturnType<M["getState"]>, send: M["send"]];
};

function $useExternalStateMachine(machine: Machine.External.Impl) {
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

/**
 * Hook to use a state machine.
 *
 * Similar to `useStateMachine`, but uses `React.useSyncExternalStore` instead of `React.useState` to manage state.
 *
 * ```ts
 * const machine = createExternalStateMachine({
 *   // State Machine Definition
 * });
 *
 * function App() {
 *   const [machineState, send] = useExternalStateMachine(machine);
 *
 *   // ...
 * }
 * ```
 *
 * @template D The type of the state machine definition.
 * @param machine A state machine object.
 * @returns An array with the current state and the send function.
 */
export const useExternalStateMachine =
  $useExternalStateMachine as unknown as UseExternalStateMachine;

export { type UseExternalStateMachine };

export {
  createExternalStateMachine,
  type CreateExternalStateMachine,
} from "./createExternalStateMachine";

export { t } from "./core/util";
