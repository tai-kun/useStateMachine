import type { $$t } from "./src";

/**
 * TypeScript will automatically infer your context type; event types are generated automatically.
 *
 * Still, there are situations where you might want explicit control over the `context` and `event` types: You can provide you own typing using the `t` whithin `schema`:
 *
 * ```ts
 * import useStateMachine, { t } from "@tai-kun/use-state-machine";
 *
 * const [state, send] = useStateMachine({
 *   schema: {
 *     context: {} as t<{ toggleCount: number }>,
 *   },
 *   context: { toggleCount: 0 },
 *   initial: "inactive",
 *   states: {
 *     inactive: {
 *       on: { TOGGLE: "active" },
 *     },
 *     active: {
 *       on: { TOGGLE: "inactive" },
 *       effect({ setContext }) {
 *         setContext(context => ({ toggleCount: context.toggleCount + 1 }));
 *       },
 *     },
 *   },
 * });
 * ```
 *
 * All events are type-infered by default, both in the string notation (`send("UPDATE")`) and the object notation (`send({ type: "UPDATE"})`).
 *
 * If you want, though, you can augment an already typed event to include arbitrary data (which can be useful to provide values to be used inside effects or to update the context). Example:
 *
 * ```ts
 * const [machine, send] = useStateMachine({
 *   schema: {
 *     context: {} as t<{ timeout?: number }>,
 *     events: {
 *       PING: {} as t<{ value: number }>,
 *     },
 *   },
 *   context: {timeout: undefined},
 *   initial: "waiting",
 *   states: {
 *     waiting: {
 *       on: {
 *         PING: "pinged",
 *       },
 *     },
 *     pinged: {
 *       effect({ setContext, event }) {
 *         setContext(c => ({ timeout: event?.value ?? 0 }));
 *       },
 *     },
 *   },
 * });
 *
 * send({ type: "PING", value: 150 })
 * ```
 *
 * **Note** that you don't need to declare all your events in the schema, only the ones you're adding arbitrary keys and values.
 *
 * @template T The type of the context or event.
 * @returns An object that represents the type of the context or event.
 * @see https://usestatemachine.js.org/docs/api/#schema-context--event-typing
 */
export type t<T> = { [$$t]: T };
