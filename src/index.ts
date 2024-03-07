export {
  createExternalStateMachine,
  type CreateExternalStateMachine,
} from "./createExternalStateMachine";
export {
  defineStateMachine,
  type SyncedRefObject,
  type CreateDefinition,
  type DefineWithoutProps,
  type DefineWithProps,
  type DefineStateMachine,
} from "./defineStateMachine";
export {
  useExternalStateMachine,
  type UseExternalStateMachine,
} from "./useExternalStateMachine";
export {
  useSyncedStateMachine,
  type UseSyncedStateMachine,
} from "./useSyncedStateMachine";
export {
  /** @deprecated Use `import { useStateMachine } from "@tai-kun/use-state-machine"` instead. */
  useStateMachine as default,
  useStateMachine,
  type UseStateMachine,
} from "./useStateMachine";
export { type t } from "./core/util";
