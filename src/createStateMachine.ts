import type { A, Machine } from "./core/src";

/**
 * A function that creates a state machine definition.
 * The machine function is executed only once.
 * If you use dynamically changing arguments, you need to mark them as transferable values.
 * If there are arguments marked as transferable (by `Transfer`), they must be transferred with the `transfer` function.
 *
 * ```ts
 * function machine(staticParam: string, onChange: Transfer<Function>) {
 *   return createStateMachine({
 *     // State Machine Definition
 *     // context: staticParam,
 *     initial: "inactive",
 *     states: {
 *       inactive: {
 *         on: { TOGGLE: "active" },
 *         effect() {
 *           onChange.current(false);
 *         },
 *       },
 *       active: {
 *         on: { TOGGLE: "inactive" },
 *         effect() {
 *           onChange.current(true);
 *         },
 *       },
 *     },
 *   });
 * }
 *
 * function App(props) {
 *   const someStaticParam = "";
 *   const [machineState, send] = useStateMachine(
 *     machine,
 *     someStaticParam,
 *     transfer(props.onChange)
 *   );
 *
 *   // ...
 * }
 * ```
 *
 * @template D The type of the state machine definition.
 * @param definition The state machine definition.
 * @returns The state machine.
 */
type CreateStateMachine = <const D extends Machine.Definition<D>>(
  definition: A.InferNarrowestObject<D>,
) => ReturnType<Machine<D>>;

function $createStateMachine(
  def: Machine.Definition.Impl,
): ReturnType<Machine.Impl> {
  return { def } as any;
}

export { type CreateStateMachine };

export const createStateMachine =
  $createStateMachine as unknown as CreateStateMachine;
