import type { Machine } from "./src";
import useSingleton from "./useSingleton";
import { useSyncedRef } from "./useSyncedRef";

export function useDefinition(
  arg0: Machine.Definition.Impl | Machine.Impl,
  ...args: [unknown?]
) {
  const ref = useSyncedRef(args);

  return useSingleton(() =>
    "new" in arg0
      ? arg0.new(...ref.current, (d: Machine.Definition.Impl) => d)
      : arg0,
  );
}
