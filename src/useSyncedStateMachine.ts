import { useDefinition, useSingleton } from "./core/hooks";
import {
  type Action,
  createInitialState,
  processDispatch,
  processEffect,
} from "./core/logic";
import { useEffect, useRef } from "./core/react";
import type { $$t, A, Machine } from "./core/src";

type UseSyncedStateMachine = {
  /**
   * Hook to use a state machine.
   *
   * Similar to `useStateMachine`, but updates state directly instead of `React.useState`.
   *
   * Therefore, calling the `send` function will not trigger a re-render.
   *
   * ```ts
   * function App() {
   *   const [getState, send] = useSyncedStateMachine({
   *     // State Machine Definition
   *   });
   *   const state = getState();
   *
   *   // ...
   * }
   * ```
   *
   * @template D The type of the state machine definition.
   * @param definition The definition of the state machine.
   * @returns An array with two elements:
   * - The first element is a function that returns the current state of the machine.
   * - The second element is a function that sends an event to the machine.
   */
  <const D extends Machine.Definition<D>>(
    definition: A.InferNarrowestObject<D>,
  ): [
    getState: () => Machine.State<Machine.Definition.FromTypeParamter<D>>,
    send: Machine.Send<Machine.Definition.FromTypeParamter<D>>,
  ];
  /**
   * This hook uses pre-defined state machine definitions.
   *
   * ```ts
   * const machine = defineStateMachine((create) =>
   *   create({
   *     // State Machine Definition
   *   })
   * );
   *
   * function App() {
   *   const [machineState, send] = useSyncedStateMachine(machine);
   *
   *   // ...
   * }
   * ```
   *
   * or
   *
   * ```ts
   * type Props = {
   *   onChange(active: boolean): void
   * };
   *
   * const machine = defineStateMachine<Props>()((props, create) =>
   *   create({
   *     initial: "inactive",
   *     states: {
   *       inactive: {
   *         on: { TOGGLE: "active" },
   *         effect() {
   *           props.current.onChange(false);
   *         },
   *       },
   *       active: {
   *         on: { TOGGLE: "inactive" },
   *         effect() {
   *           props.current.onChange(true);
   *         },
   *       },
   *     },
   *   }),
   * );
   *
   * function App(props: Props) {
   *   const [machineState, send] = useSyncedStateMachine(machine, props);
   *
   *   // ...
   * }
   * ```
   *
   * @template M The type of the state machine.
   * @param machine The state machine.
   * @param args The arguments to pass to the state machine.
   * @returns An array with two elements:
   * - The first element is a function that returns the current state of the machine.
   * - The second element is a function that sends an event to the machine.
   */
  <const M extends Machine.Type>(
    machine: M,
    ...args: M[typeof $$t]["args"]
  ): [getState: () => M[typeof $$t]["state"], send: M[typeof $$t]["send"]];
};

type SetStateAction = (state: Machine.State.Impl) => Machine.State.Impl;

function $useSyncedStateMachine(
  ...args: [Machine.Definition.Impl | Machine.Impl, unknown?]
) {
  const def = useDefinition(...args);
  const exitFnRef = useRef<void | (() => void)>();
  const [reqSync, machineApi] = useSingleton(() => {
    const queue: SetStateAction[] = [];
    let machineState = createInitialState(def);
    let previousDeps: readonly unknown[] | undefined;

    /**
     * Runs a callback when the dependencies change.
     *
     * @param callback The callback to run when the dependencies change.
     * @param nextDeps The new dependencies to compare with the current dependencies.
     */
    function sideEffect(
      callback: () => void | (() => void),
      deps: readonly unknown[],
    ) {
      if (previousDeps?.every((dep, i) => Object.is(dep, deps[i])) !== true) {
        exitFnRef.current?.();
        exitFnRef.current = callback();
        previousDeps = deps;
      }
    }

    /**
     * Dispatches an action to the state machine.
     * No action is taken immediately.
     * The action is enqueued and will be processed later in the `act` function.
     *
     * @param action The action to dispatch to the state machine.
     */
    function dispatch(action: Action) {
      // `queue.push` means `React.useState`
      queue.push((currentState) => processDispatch(def, currentState, action));
    }

    /**
     * Requests a synchronization of the state machine.
     */
    function requestSync() {
      const state = machineState; // bind to the current state

      sideEffect(() => {
        function send(sendable: Machine.Sendable.Impl) {
          dispatch({
            type: "SEND",
            payload: sendable,
          });
        }

        return processEffect(def, state, {
          send,
          setContext(updater: Machine.ContextUpdater.Impl) {
            dispatch({
              type: "SET_CONTEXT",
              payload: updater,
            });

            return { send };
          },
        });
      }, [state.value, state.event]);
    }

    /**
     * Processes the queue of actions and synchronizes the state machine.
     *
     * @param render A function that renders the state machine.
     */
    function act(render: () => void) {
      render();

      while (queue.length) {
        while (queue.length) {
          const action = queue.shift()!;
          machineState = action(machineState);
        }

        requestSync();
      }
    }

    return [
      () => act(requestSync),
      [
        () => machineState,
        function send(sendable: Machine.Sendable.Impl) {
          act(() => {
            dispatch({
              type: "SEND",
              payload: sendable,
            });
          });
        },
      ],
    ] as const;
  });
  useEffect(() => {
    reqSync();

    return () => {
      exitFnRef.current?.();
    };
  }, []);

  return machineApi;
}

export const useSyncedStateMachine =
  $useSyncedStateMachine as unknown as UseSyncedStateMachine;

export { type UseSyncedStateMachine };

export {
  defineStateMachine,
  type SyncedRefObject,
  type CreateDefinition,
  type DefineWithoutProps,
  type DefineWithProps,
  type DefineStateMachine,
} from "./defineStateMachine";

export { type t } from "./core/util";
