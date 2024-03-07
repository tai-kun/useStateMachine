import type { Machine } from "./src";
import useSingleton from "./useSingleton";
import { type SyncedRefObject, useSyncedRef } from "./useSyncedRef";

export type CreateDefinitionImpl = {
  /**
   * Define a state machine to use with `useStateMachine` or `useSyncedStateMachine`.
   *
   * @param definition The state machine definition.
   * @returns The state machine definition.
   */
  (definition: Machine.Definition.Impl): Machine.Definition.Impl;
};

export type DefineWithoutPropsImpl = {
  /**
   * Define a state machine to use with `useStateMachine` or `useSyncedStateMachine`.
   *
   * @param create A function that creates a state machine definition.
   * @returns The state machine definition.
   */
  (create: CreateDefinitionImpl): Machine.Definition.Impl;
};

export type DefineWithPropsImpl = {
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

/**
 * Returns a state machine definition.
 *
 * @param arg0 The state machine definition or a function that creates a state machine definition.
 * @param args Arguments to pass to the state machine definition factory.
 * @returns The state machine definition.
 */
export function useDefinition(
  arg0: Machine.Definition.Impl | Machine.Impl,
  ...args: [props?: unknown]
) {
  const props = useSyncedRef(args[0]);

  return useSingleton(() =>
    "new" in arg0
      ? args.length
        ? (arg0.new as DefineWithPropsImpl)(props, (d) => d)
        : (arg0.new as DefineWithoutPropsImpl)((d) => d)
      : arg0,
  );
}
