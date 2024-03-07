import { useRef } from "react";
import type { SyncedRefObject } from "./src";

export function useSyncedRef<T>(value: T): SyncedRefObject<T> {
  const ref = useRef(value);
  ref.current = value;

  return ref;
}
