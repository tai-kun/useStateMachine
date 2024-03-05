import { type Machine, R } from "./src";

/**
 * Creates a initial state-machine state.
 *
 * @param def State-machine definition.
 * @returns initial state-machine state.
 */
export default function createInitialState(
  def: Machine.Definition.Impl,
): Machine.State.Impl {
  const nextEvents = R.keys(
    R.concat(
      R.fromMaybe(R.get(def.states, def.initial)!.on),
      R.fromMaybe(def.on),
    ),
  );

  return {
    event: { type: "$$initial" } as Machine.Event.Impl,
    value: def.initial,
    context: def.context as Machine.Context.Impl,
    nextEvents: nextEvents,
    nextEventsT: nextEvents,
  };
}
