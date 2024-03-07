import type { A, Machine, SyncedRefObject } from "./core/src";

type CreateDefinition = {
  /**
   * A function that creates a state machine definition.
   *
   * @template D The type of the state machine definition.
   * @param definition The state machine definition.
   * @returns The state machine definition.
   */
  <const D extends Machine.Definition<D>>(
    definition: A.InferNarrowestObject<D>,
  ): D;
};

/**
 * Define a state machine to use with `useStateMachine` or `useSyncedStateMachine`.
 *
 * @template D The type of the state machine definition.
 */
type DefineWithoutProps<D> = {
  /**
   * Define a state machine to use with `useStateMachine` or `useSyncedStateMachine`.
   *
   * @param create A function that creates a state machine definition.
   * @returns The state machine definition.
   */
  (create: CreateDefinition): D;
};

/**
 * Define a state machine to use with `useStateMachine` or `useSyncedStateMachine`.
 *
 * @template D The type of the state machine definition.
 * @template P The type of the props object.
 */
type DefineWithProps<D, P> = {
  /**
   * Define a state machine to use with `useStateMachine` or `useSyncedStateMachine`.
   *
   * @param props A reference to the props object.
   * @param create A function that creates a state machine definition.
   * @returns The state machine definition.
   */
  (props: SyncedRefObject<P>, create: CreateDefinition): D;
};

type CreateDefinitionImpl = {
  /**
   * Define a state machine to use with `useStateMachine` or `useSyncedStateMachine`.
   *
   * @param definition The state machine definition.
   * @returns The state machine definition.
   */
  (definition: Machine.Definition.Impl): Machine.Definition.Impl;
};

type DefineWithoutPropsImpl = {
  /**
   * Define a state machine to use with `useStateMachine` or `useSyncedStateMachine`.
   *
   * @param create A function that creates a state machine definition.
   * @returns The state machine definition.
   */
  (create: CreateDefinitionImpl): Machine.Definition.Impl;
};

type DefineWithPropsImpl = {
  /**
   * Define a state machine to use with `useStateMachine` or `useSyncedStateMachine`.
   *
   * @param props A reference to the props object.
   * @param create A function that creates a state machine definition.
   * @returns The state machine definition.
   */
  (
    props: SyncedRefObject,
    create: CreateDefinitionImpl,
  ): Machine.Definition.Impl;
};

type DefineStateMachine = {
  /**
   * Define a state machine to use with `useStateMachine` or `useSyncedStateMachine`.
   *
   * ```ts
   * const machine = defineStateMachine((create) =>
   *   create({
   *     // State Machine Definition
   *   })
   * );
   *
   * function App() {
   *   const [machineState, send] = useStateMachine(machine);
   *
   *   // ...
   * }
   * ```
   *
   * @template D The type of the state machine definition.
   * @param define A function that creates a state machine definition.
   * @returns A state machine to use with `useStateMachine` or `useSyncedStateMachine`.
   */
  <const D>(define: DefineWithoutProps<D>): Machine<D>;
  /**
   * Define a state machine to use with `useStateMachine` or `useSyncedStateMachine`.
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
   *   const [machineState, send] = useStateMachine(machine, props);
   *
   *   // ...
   * }
   * ```
   *
   * @template P The type of the props object.
   */
  <P>(): {
    /**
     * @template D The type of the state machine definition.
     * @param define A function that creates a state machine definition.
     * @returns A state machine to use with `useStateMachine` or `useSyncedStateMachine`.
     */
    // biome-ignore lint/suspicious/noRedeclare: It's probably a linter bug.
    <const D>(define: DefineWithProps<D, P>): Machine<D, P>;
  };
};

function $defineStateMachine(def1?: DefineWithoutPropsImpl) {
  return typeof def1 === "function"
    ? { new: def1 }
    : (def2: DefineWithPropsImpl) => ({ new: def2 });
}

export {
  type SyncedRefObject,
  type CreateDefinition,
  type DefineWithoutProps,
  type DefineWithProps,
  type DefineStateMachine,
};

export const defineStateMachine =
  $defineStateMachine as unknown as DefineStateMachine;
