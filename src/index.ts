import { useEffect, useReducer } from "react";
import { R, assertNever, useConstant } from "./extras";
import { $$t, Machine, UseStateMachine } from "./types";

function useStateMachine(definition: Machine.Definition.Impl) {
  const [state, dispatch] = useReducer(
    createReducer(definition),
    createInitialState(definition),
  );

  const send = useConstant(
    () => (sendable: Machine.Sendable.Impl) =>
      dispatch({ type: "SEND", sendable }),
  );

  const setContext = (updater: Machine.ContextUpdater.Impl) => {
    dispatch({ type: "SET_CONTEXT", updater });
    return { send };
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: ignore
  useEffect(() => {
    const entry = R.get(definition.states, state.value)!.effect;
    const exit = entry?.({
      send,
      setContext,
      event: state.event,
      context: state.context,
    });

    return typeof exit === "function"
      ? () =>
          exit?.({
            send,
            setContext,
            event: state.event,
            context: state.context,
          })
      : undefined;
  }, [state.value, state.event]);

  return [state, send];
}

function createInitialState(
  definition: Machine.Definition.Impl,
): Machine.State.Impl {
  const nextEvents = R.keys(
    R.concat(
      R.fromMaybe(R.get(definition.states, definition.initial)!.on),
      R.fromMaybe(definition.on),
    ),
  );

  return {
    value: definition.initial,
    context: definition.context as Machine.Context.Impl,
    event: { type: "$$initial" } as Machine.Event.Impl,
    nextEvents: nextEvents,
    nextEventsT: nextEvents,
  };
}

function createReducer(definition: Machine.Definition.Impl) {
  const log = createLogger(definition);

  return (
    machineState: Machine.State.Impl,
    internalEvent: InternalEvent,
  ): Machine.State.Impl => {
    if (internalEvent.type === "SET_CONTEXT") {
      const nextContext = internalEvent.updater(machineState.context);

      if (process.env.NODE_ENV !== "production") {
        log(
          "Context update",
          ["Previous Context", machineState.context],
          ["Next Context", nextContext],
        );
      }

      return { ...machineState, context: nextContext };
    }

    if (internalEvent.type === "SEND") {
      const sendable = internalEvent.sendable;
      const event =
        typeof sendable === "string" ? { type: sendable } : sendable;
      const context = machineState.context;
      const stateNode = R.get(definition.states, machineState.value)!;
      const resolvedTransition =
        R.get(R.fromMaybe(stateNode.on), event.type) ??
        R.get(R.fromMaybe(definition.on), event.type);

      if (!resolvedTransition) {
        if (process.env.NODE_ENV !== "production") {
          log(
            `Current state doesn't listen to event type "${event.type}".`,
            ["Current State", machineState],
            ["Event", event],
          );
        }

        return machineState;
      }

      const [nextStateValue, didGuardDeny = false] = (() => {
        if (typeof resolvedTransition === "string") {
          return [resolvedTransition];
        }

        if (resolvedTransition.guard === undefined) {
          return [resolvedTransition.target];
        }

        if (resolvedTransition.guard({ context, event })) {
          return [resolvedTransition.target];
        }

        return [resolvedTransition.target, true];
      })() as [Machine.StateValue.Impl, true?];

      if (didGuardDeny) {
        if (process.env.NODE_ENV !== "production") {
          log(
            `Transition from "${machineState.value}" to "${nextStateValue}" denied by guard`,
            ["Event", event],
            ["Context", context],
          );
        }

        return machineState;
      }

      if (process.env.NODE_ENV !== "production") {
        log(`Transition from "${machineState.value}" to "${nextStateValue}"`, [
          "Event",
          event,
        ]);
      }

      const resolvedStateNode = R.get(definition.states, nextStateValue)!;
      const nextEvents = R.keys(
        R.concat(R.fromMaybe(resolvedStateNode.on), R.fromMaybe(definition.on)),
      );

      return {
        value: nextStateValue,
        context,
        event,
        nextEvents,
        nextEventsT: nextEvents,
      };
    }

    return assertNever(internalEvent);
  };
}

interface SetContextEvent {
  type: "SET_CONTEXT";
  updater: Machine.ContextUpdater.Impl;
}

interface SendEvent {
  type: "SEND";
  sendable: Machine.Sendable.Impl;
}

type InternalEvent = SetContextEvent | SendEvent;

export type Console = {
  log: (a: string, b: string | object) => void;
  groupCollapsed?: (...l: string[]) => void;
  groupEnd?: () => void;
};

function createLogger(definition: Machine.Definition.Impl) {
  return function log(
    groupLabel: string,
    ...nested: [string, string | object][]
  ): void {
    if (!definition.verbose) {
      return;
    }

    const console_ = definition.console || console;

    if (process.env.NODE_ENV !== "production") {
      console_.groupCollapsed?.(
        "%cuseStateMachine",
        "color: #888; font-weight: lighter;",
        groupLabel,
      );

      for (const message of nested) {
        console_.log(message[0], message[1]);
      }

      console_.groupEnd?.();
    }
  };
}

export default useStateMachine as unknown as UseStateMachine;

export const t = <T>() => ({ [$$t]: undefined as T });
