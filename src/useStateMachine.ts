import createInitialState from "./core/createInitialState";
import processDispatch, { type Action } from "./core/processDispatch";
import { useState } from "./core/react";
import type { A, Machine } from "./core/src";
import useSingleton from "./core/useSingleton";
import useSync, { type Dispatchers } from "./core/useSync";

type UseStateMachine = <const D extends Machine.Definition<D>>(
  definition: A.InferNarrowestObject<D>,
) => [
  state: Machine.State<Machine.Definition.FromTypeParamter<D>>,
  send: Machine.Send<Machine.Definition.FromTypeParamter<D>>,
];

function useStateMachine(def: Machine.Definition.Impl) {
  const [state, setState] = useState(() => createInitialState(def));
  const dispatchers = useSingleton<Dispatchers>(() => {
    function dispatch(action: Action) {
      setState((currentState) => processDispatch(def, currentState, action));
    }

    function send(sendable: Machine.Sendable.Impl) {
      dispatch({
        type: "SEND",
        payload: sendable,
      });
    }

    return {
      send,
      setContext(updater) {
        dispatch({
          type: "SET_CONTEXT",
          payload: updater,
        });

        return { send };
      },
    };
  });

  useSync(def, state, dispatchers);

  return [state, dispatchers.send];
}

export { type UseStateMachine };

/**
 * # API
 *
 * ```ts
 * const [state, send] = useStateMachine(
 *   // State Machine Definition
 * );
 * ```
 *
 * `useStateMachine` takes a JavaScript object as the state machine definition. It returns an array consisting of a `current machine state` object and a `send` function to trigger transitions.
 *
 * ## state
 *
 * The machine's `state` consists of 4 properties: `value`, `event`, `nextEvents` and `context`.
 *
 * `value` (string): Returns the name of the current state.
 *
 * `event` (`{type: string}`; Optional): The name of the last sent event that led to this state.
 *
 * `nextEvents` (`string[]`): An array with the names of available events to trigger transitions from this state.
 *
 * `context`: The state machine extended state. See "Extended State" below.
 *
 * ## Send events
 *
 * `send` takes an event as argument, provided in shorthand string format (e.g. "TOGGLE") or as an event object (e.g. `{ type: "TOGGLE" }`)
 *
 * If the current state accepts this event, and it is allowed (see guard), it will change the state machine state and execute effects.
 *
 * You can also send additional data with your event using the object notation (e.g. `{ type: "UPDATE" value: 10 }`). Check [schema](#schema-context--event-typing) for more information about strong typing the additional data.
 *
 * ## State Machine definition
 *
 * | Key     | Required | Description                                                                                                                     |
 * | ------- | -------- | ------------------------------------------------------------------------------------------------------------------------------- |
 * | verbose |          | If true, will log every context & state changes. Log messages will be stripped out in the production build.                     |
 * | schema  |          | For usage with TypeScript only. Optional strongly-typed context & events. More on schema [below](#schema-context--event-typing) |
 * | context |          | Context is the machine's extended state. More on extended state [below](#extended-state-context)                                |
 * | initial | \*       | The initial state node this machine should be in                                                                                |
 * | states  | \*       | Define the possible finite states the state machine can be in.                                                                  |
 *
 * ## Defining States
 *
 * A finite state machine can be in only one of a finite number of states at any given time. As an application is interacted with, events cause it to change state.
 *
 * States are defined with the state name as a key and an object with two possible keys: `on` (which events this state responds to) and `effect` (run arbitrary code when entering or exiting this state):
 *
 * ### On (Events & transitions)
 *
 * Describes which events this state responds to (and to which other state the machine should transition to when this event is sent):
 *
 * ```ts twoslash
 * import useStateMachine from "@tai-kun/use-state-machine";
 * // ---cut---
 * const [state, send] = useStateMachine({
 *   initial: "active",
 *   states: {
 *     inactive: {
 *       on: {
 *         TOGGLE: "active",
 *       },
 *     },
 *     active: {
 *       on: {
 *         TOGGLE: "inactive",
 *       },
 *     },
 *   },
 * });
 * ```
 *
 * The event definition can also use the extended, object syntax, which allows for more control over the transition (like adding guards):
 *
 * ```ts
 * on: {
 *   TOGGLE: {
 *     target: 'active',
 *   },
 * };
 * ```
 *
 * #### Guards
 *
 * Guards are functions that run before actually making the state transition: If the guard returns false the transition will be denied.
 *
 * ```ts twoslash
 * import useStateMachine from "@tai-kun/use-state-machine";
 * // ---cut---
 * const [state, send] = useStateMachine({
 *   initial: "inactive",
 *   states: {
 *     inactive: {
 *       on: {
 *         TOGGLE: {
 *           target: "active",
 *           guard({ context, event }) {
 *             // Return a boolean to allow or block the transition
 *             return false;
 *           },
 *         },
 *       },
 *     },
 *     active: {
 *       on: { TOGGLE: "inactive" },
 *     },
 *   },
 * });
 * ```
 *
 * The guard function receives an object with the current context and the event. The event parameter always uses the object format (e.g. `{ type: 'TOGGLE' }`).
 *
 * ### Effects (entry/exit callbacks)
 *
 * Effects are triggered when the state machine enters a given state. If you return a function from your effect, it will be invoked when leaving that state (similarly to how useEffect works in React).
 *
 * ```ts twoslash
 * import useStateMachine from "@tai-kun/use-state-machine";
 * // ---cut---
 * const [state, send] = useStateMachine({
 *   initial: "active",
 *   states: {
 *     active: {
 *       on: { TOGGLE: "inactive" },
 *       effect({ send, setContext, event, context }) {
 *         console.log("Just entered the Active state");
 *         return () => console.log("Just Left the Active state");
 *       },
 *     },
 *     inactive: {},
 *   },
 * });
 * ```
 *
 * The effect function receives an object as parameter with four keys:
 *
 * - `send`: Takes an event as argument, provided in shorthand string format (e.g. "TOGGLE") or as an event object (e.g. `{ type: "TOGGLE" }`)
 * - `setContext`: Takes an updater function as parameter to set a new context (more on context below). Returns an object with `send`, so you can set the context and send an event on a single line.
 * - `event`: The event that triggered a transition to this state. (The event parameter always uses the object format (e.g. `{ type: 'TOGGLE' }`).).
 * - `context` The context at the time the effect runs.
 *
 * In this example, the state machine will always send the "RETRY" event when entering the error state:
 *
 * ```typescript
 * const [state, send] = useStateMachine({
 *   initial: "loading",
 *   states: {
 *     // Other states here...
 *     error: {
 *       on: {
 *         RETRY: "load",
 *       },
 *       effect({ send }) {
 *         send("RETRY");
 *       },
 *     },
 *   },
 * });
 * ```
 *
 * ## Extended state (context)
 *
 * Besides the finite number of states, the state machine can have extended state (known as context).
 *
 * You can provide the initial context value in the state machine definition, then use the `setContext` function within your effects to change the context:
 *
 * ```ts twoslash
 * import useStateMachine from "@tai-kun/use-state-machine";
 * // ---cut---
 * const [state, send] = useStateMachine({
 *   context: { toggleCount: 0 },
 *   initial: "inactive",
 *   states: {
 *     inactive: {
 *       on: { TOGGLE: "active" },
 *     },
 *     active: {
 *       on: { TOGGLE: "inactive" },
 *       effect({ setContext }) {
 *         setContext((context) => ({ toggleCount: context.toggleCount + 1 }));
 *       },
 *     },
 *   },
 * });
 *
 * console.log(state); // { context: { toggleCount: 0 }, value: 'inactive', nextEvents: ['TOGGLE'] }
 *
 * send("TOGGLE");
 *
 * console.log(state); // { context: { toggleCount: 1 }, value: 'active', nextEvents: ['TOGGLE'] }
 * ```
 *
 * @template D The type of the state machine definition.
 * @param definition The state machine definition.
 * @returns An array with the current state and the send function.
 * @see https://usestatemachine.js.org/docs/api/
 */
export default useStateMachine as unknown as UseStateMachine;

export { t } from "./core/util";
