import {
  type Dispatchers,
  useIsMounted,
  useSingleton,
  useSync,
} from "./core/hooks";
import { useSyncExternalStore } from "./core/react";
import type { Machine } from "./core/src";

type UseExternalStateMachine = {
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
   * @template M The type of the state machine object.
   * @param machine A state machine object.
   * @returns An array with the current state and the send function.
   */
  <const M extends { getState: any; send: any }>(
    machine: M,
  ): [state: ReturnType<M["getState"]>, send: M["send"]];
};

function $useExternalStateMachine(machine: Machine.External.Impl) {
  const isMounted = useIsMounted();
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

export const useExternalStateMachine =
  $useExternalStateMachine as unknown as UseExternalStateMachine;

export { type UseExternalStateMachine };

export {
  createExternalStateMachine,
  type CreateExternalStateMachine,
} from "./createExternalStateMachine";

export { type t } from "./core/util";
export type { Machine } from "./core/src";
