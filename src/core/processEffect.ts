import { type Machine, R } from "./src";

export type Dispatchers = Pick<
  Machine.EffectParameter.Impl,
  "send" | "setContext"
>;

export default function processEffect(
  def: Machine.Definition.Impl,
  state: Machine.State.Impl,
  dispatchers: Dispatchers,
) {
  const effectParams: Machine.EffectParameter.Impl = {
    ...dispatchers,
    event: state.event,
    context: state.context,
  };
  const { effect: enty } = R.get(def.states, state.value) || {};
  const exit = enty?.(effectParams);

  return typeof exit !== "function" ? undefined : () => exit(effectParams);
}
