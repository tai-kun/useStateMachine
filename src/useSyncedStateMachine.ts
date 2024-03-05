import createInitialState from "./core/createInitialState";
import processDispatch, { type Action } from "./core/processDispatch";
import processEffect from "./core/processEffect";
import { useEffect, useRef } from "./core/react";
import type { A, Machine } from "./core/src";
import useSingleton from "./core/useSingleton";

type UseSyncedStateMachine = <const D extends Machine.Definition<D>>(
  definition: A.InferNarrowestObject<D>,
) => [
  getState: () => Machine.State<Machine.Definition.FromTypeParamter<D>>,
  send: Machine.Send<Machine.Definition.FromTypeParamter<D>>,
];

type SetStateAction = (state: Machine.State.Impl) => Machine.State.Impl;

/**
 * Creates a queue with enqueue and consume operations.
 *
 * @template T The type of the items in the queue.
 * @returns An object with properties and methods related to the queue:
 */
function createQueue<T>() {
  const queue: T[] = [];

  return {
    /**
     * A getter that returns the current size of the queue.
     */
    get size() {
      return queue.length;
    },
    /**
     * Adds an item to the end of the queue.
     *
     * @param item The item to add to the queue.
     */
    enqueue(item: T) {
      queue.push(item);
    },
    /**
     * Removes and yields items from the front of the queue until it's empty.
     */
    *consume() {
      while (this.size) {
        yield queue.shift()!;
      }
    },
  };
}

/**
 * Creates a signal with a getter and a setter.
 *
 * @template T The type of the value of the signal.
 * @param init A function that returns the initial value of the signal.
 * @returns An array with two elements:
 * - The first element is a function that returns the current value of the signal.
 * - The second element is a function that sets the value of the signal.
 */
function createSignal<T>(init: () => T): [get: () => T, set: (v: T) => void] {
  let value = init();

  return [
    () => value,
    (v) => {
      value = v;
    },
  ];
}

/**
 * Creates a side effect with a callback and a dependency array.
 *
 * @param finalizerRef An object with a `current` property that holds the finalizer function.
 * @returns A function that takes a callback and a dependency array and runs the callback when the dependencies change.
 */
function createSideEffect(finalizerRef: { current: void | (() => void) }) {
  let deps: readonly unknown[] | undefined;

  /**
   * Runs a callback when the dependencies change.
   *
   * @param callback The callback to run when the dependencies change.
   * @param nextDeps The new dependencies to compare with the current dependencies.
   */
  return function sideEffect(
    callback: () => void | (() => void),
    nextDeps: readonly unknown[],
  ) {
    if (deps?.every((dep, i) => Object.is(dep, nextDeps[i])) !== true) {
      finalizerRef.current?.();
      finalizerRef.current = callback();
      deps = nextDeps;
    }
  };
}

function useSyncedStateMachine(def: Machine.Definition.Impl) {
  const exitFnRef = useRef<() => void>();
  const [reqSync, machineApi] = useSingleton(() => {
    const queue = createQueue<SetStateAction>();
    const sideEffect = createSideEffect(exitFnRef);
    const [machineState, setMachineState] = createSignal(() =>
      createInitialState(def),
    );

    /**
     * Dispatches an action to the state machine.
     * No action is taken immediately.
     * The action is enqueued and will be processed later in the `act` function.
     *
     * @param action The action to dispatch to the state machine.
     */
    function dispatch(action: Action) {
      // `queue.enqueue` means `React.useState`
      queue.enqueue((state) => processDispatch(def, state, action));
    }

    /**
     * Requests a synchronization of the state machine.
     */
    function requestSync() {
      const state = machineState();

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

      while (queue.size) {
        for (const action of queue.consume()) {
          setMachineState(action(machineState()));
        }

        requestSync();
      }
    }

    return [
      () => act(requestSync),
      [
        machineState,
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

export { type UseSyncedStateMachine };

/**
 * Hook to use a state machine.
 *
 * Similar to `useStateMachine`, but updates state directly instead of `React.useState`.
 *
 * Therefore, calling the `send` function will not trigger a re-render.
 *
 * ```ts
 * const [getState, send] = useSyncedStateMachine(
 *   // State Machine Definition
 * );
 * const state = getState();
 * ```
 *
 * @template D The type of the state machine definition.
 * @param definition The definition of the state machine.
 * @returns An array with two elements:
 * - The first element is a function that returns the current state of the machine.
 * - The second element is a function that sends an event to the machine.
 */
export default useSyncedStateMachine as unknown as UseSyncedStateMachine;

export { t } from "./core/util";
