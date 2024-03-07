import { type Action, createInitialState, processDispatch } from "./core/logic";
import type { A, Machine } from "./core/src";

type CreateExternalStateMachine = {
  /**
   * Creates a external state machine object.
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
   * @param definition The state machine definition.
   * @returns A external state machine object.
   */
  <const D extends Machine.Definition<D>>(
    definition: A.InferNarrowestObject<D>,
  ): Machine.External<D>;
};

function $createExternalStateMachine(
  def: Machine.Definition.Impl,
): Machine.External.Impl {
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

  function send(payload: Machine.Sendable.Impl) {
    dispatch({
      type: "SEND",
      payload,
    });
  }

  return {
    def,
    send,
    getState: () => state,
    subscribe(callback) {
      callbacks.add(callback);

      return () => {
        callbacks.delete(callback);
      };
    },
    setContext(payload) {
      dispatch({
        type: "SET_CONTEXT",
        payload,
      });

      return { send };
    },
  };
}

export const createExternalStateMachine =
  $createExternalStateMachine as unknown as CreateExternalStateMachine;

export { type CreateExternalStateMachine };
