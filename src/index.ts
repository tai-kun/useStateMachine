export {
  createExternalStateMachine,
  type CreateExternalStateMachine,
} from "./createExternalStateMachine";
export {
  createStateMachine,
  type CreateStateMachine,
} from "./createStateMachine";
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
export { type t, transfer } from "./core/util";
export type { Machine, Transfer, InferSend, InferState } from "./core/src";
