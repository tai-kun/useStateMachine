import processEffect, { type Dispatchers } from "./processEffect";
import { useEffect } from "./react";
import type { Machine } from "./src";

export type { Dispatchers };

export default function useSync(
  def: Machine.Definition.Impl,
  state: Machine.State.Impl,
  dispatchers: Dispatchers,
) {
  useEffect(
    () => processEffect(def, state, dispatchers),
    [state.value, state.event],
  );
}
