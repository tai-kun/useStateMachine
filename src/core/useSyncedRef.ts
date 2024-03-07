import { useRef } from "react";

/**
 * A reference to an object.
 *
 * @template T The type of the object.
 */
export type SyncedRefObject<T = unknown> = {
  /**
   * The current value of the reference.
   */
  readonly current: T;
};

export function useSyncedRef<T>(value: T): SyncedRefObject<T> {
  const ref = useRef(value);
  ref.current = value;

  return ref;
}
