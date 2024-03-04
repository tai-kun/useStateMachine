import { useEffect, useRef } from "react";
import {
  R,
  type ReducerAction,
  createInitialState,
  createReducer,
  useConstant,
} from "./misc";
import type { A, Machine } from "./types";

export type UseSyncedStateMachine = <const D extends Machine.Definition<D>>(
  definition: A.InferNarrowestObject<D>,
) => [
  stateRef: {
    readonly current: Machine.State<Machine.Definition.FromTypeParamter<D>>;
  },
  send: Machine.Send<Machine.Definition.FromTypeParamter<D>>,
];

function useSyncedStateMachine(definition: Machine.Definition.Impl) {
  const cleanupRef = useRef<() => void>();

  useEffect(() => cleanupRef.current, []);

  return useConstant(() => {
    const reducer = createReducer(definition);
    const stateRef = { current: createInitialState(definition) };

    function dispatch(action: ReducerAction): void {
      const state = reducer(stateRef.current, action);

      if (
        !Object.is(state.value, stateRef.current.value) ||
        !Object.is(state.event, stateRef.current.event)
      ) {
        cleanupRef.current?.();
        const { effect } = R.get(definition.states, state.value) || {};
        const cleanup = effect?.({
          send,
          event: state.event,
          context: state.context,
          setContext,
        });

        if (typeof cleanup === "function") {
          cleanupRef.current = () => {
            cleanupRef.current = undefined;
            cleanup?.({
              send,
              event: state.event,
              context: state.context,
              setContext,
            });
          };
        }
      }

      stateRef.current = state;
    }

    function send(sendable: Machine.Sendable.Impl): void {
      dispatch({
        type: "SEND",
        sendable,
      });
    }

    function setContext(updater: Machine.ContextUpdater.Impl) {
      dispatch({
        type: "SET_CONTEXT",
        updater,
      });

      return { send };
    }

    return [stateRef, send];
  });
}

export default useSyncedStateMachine as unknown as UseSyncedStateMachine;

export { t } from "./utils";
