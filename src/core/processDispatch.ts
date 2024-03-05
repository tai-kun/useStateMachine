import { type Machine, R } from "./src";

/**
 * Basic action type.
 *
 * @template T Action type.
 * @template P Action payload type.
 */
export type ActionType<T extends string, P> = {
  readonly type: T;
  readonly payload: P;
};

/**
 * Actions to update state-machine state.
 */
export type Action =
  | ActionType<"SEND", Machine.Sendable.Impl>
  | ActionType<"SET_CONTEXT", Machine.ContextUpdater.Impl>;

/**
 * Update state-machine state.
 *
 * @param def State-machine def.
 * @param state State-machine state.
 * @param action Action to dispatch.
 * @returns New state.
 */
export default function processDispatch(
  def: Machine.Definition.Impl,
  state: Machine.State.Impl,
  action: Action,
): Machine.State.Impl {
  function log(
    groupLabel: string,
    ...nested: [string, string | object][]
  ): void {
    if (__DEV__) {
      if (!def.verbose) {
        return;
      }

      const console_ = def.console || console;
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

  switch (action.type) {
    case "SEND": {
      const { payload } = action;
      const event = typeof payload === "string" ? { type: payload } : payload;
      const stateNode = R.get(def.states, state.value)!;
      const resolvedTransition =
        R.get(R.fromMaybe(stateNode.on), event.type) ??
        R.get(R.fromMaybe(def.on), event.type);

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

      const { context } = state;
      const [nextStateValue, didGuardDeny] =
        typeof resolvedTransition === "string"
          ? [resolvedTransition, false]
          : [
              resolvedTransition.target,
              resolvedTransition.guard?.({ context, event }) === false,
            ];

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
        // biome-ignore format: preserve
        log(
          `Transition from "${state.value}" to "${nextStateValue}"`,
          ["Event", event],
        );
      }

      const resolvedStateNode = R.get(def.states, nextStateValue)!;
      const nextEvents = R.keys(
        R.concat(R.fromMaybe(resolvedStateNode.on), R.fromMaybe(def.on)),
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
      const nextContext = action.payload(state.context);

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
      throw new Error(`Unknown action type: ${(action as any).type}`);
  }
}
