/* -----------------------------------------------------------------------------
 *
 * See https://github.com/cassiozen/useStateMachine/blob/main/src/
 *
 * -------------------------------------------------------------------------- */

import type { $$t } from "./util"

export type $$t = typeof $$t;

/* -----------------------------------------------------------------------------
 *
 * See https://github.com/cassiozen/useStateMachine/blob/main/src/types.ts
 *
 * -------------------------------------------------------------------------- */

/**
 * The state machine.
 * 
 * @template D The type of the state machine definition.
 * @template P The type of the reference object.
 */
export type Machine<
  D = Machine.Definition.Impl,
  P = never,
> = {
  /**
   * Creates a new state machine.
   * 
   * @param args The arguments for the state machine.
   * @returns The state machine definition.
   */
  new: (...args: unknown[]) => Machine.Definition.Impl
  /**
   * @internal
   */
  [$$t]: {
    state: Machine.State<Machine.Definition.FromTypeParamter<D>>
    send: Machine.Send<Machine.Definition.FromTypeParamter<D>>
    args: [P] extends [never] ? [] : [props: P]
  }
};

/**
 * Collections of types and interfaces for the state machine.
 */
export namespace Machine {
  /**
   * The state machine for internal usage.
   * 
   * @param args The arguments for the state machine.
   * @returns The state machine definition.
   */
  export type Impl = {
    /**
     * Creates a new state machine.
     * 
     * @param args The arguments for the state machine.
     * @returns The state machine definition.
     */
    new: (...args: unknown[]) => Machine.Definition.Impl
    /**
     * @internal
     */
    [$$t]: {
      state: Machine.State.Impl
      send: Machine.Send.Impl
      args: [param?: unknown]
    }
  };

  /**
   * @internal
   */
  export type Type = {
    [$$t]: {
      state: unknown
      send: unknown
      args: unknown[]
    }
  };

  /**
   * External state machine object.
   *
   * @template D The type of the state machine definition.
   */
  export type External<D = Machine.Definition.Impl> = {
    /**
     * The state machine definition.
     */
    def: D
    /**
     * Sends an event to the state machine.
     */
    send: Machine.Send<Machine.Definition.FromTypeParamter<D>>
    /**
     * Returns a snapshot of the current state of the state machine.
     * 
     * @returns The current state of the state machine.
     */
    getState: () => Machine.State<Machine.Definition.FromTypeParamter<D>>
    /**
     * Subscribes to state changes in the state machine.
     * 
     * @param callback A function that is called whenever the state machine changes state.
     * @returns A function to unsubscribe from state changes.
     */
    subscribe: (callback: (state: Machine.State<Machine.Definition.FromTypeParamter<D>>) => void) => () => void
    /**
     * Sets the context of the state machine.
     */
    setContext: Machine.SetContext<Machine.Definition.FromTypeParamter<D>>
  }

  /**
   * Collections of types and interfaces for the external state machine.
   */
  export namespace External {
    /**
     * External state machine object for internal usage.
     */
    export type Impl = {
      /**
       * The state machine definition.
       */
      def: Machine.Definition.Impl
      /**
       * Sends an event to the state machine.
       */
      send: Machine.Send.Impl
      /**
       * Returns a snapshot of the current state of the state machine.
       * 
       * @returns The current state of the state machine.
       */
      getState: () => Machine.State.Impl
      /**
       * Subscribes to state changes in the state machine.
       * 
       * @param callback A function that is called whenever the state machine changes state.
       * @returns A function to unsubscribe from state changes.
       */
      subscribe: (callback: (state: Machine.State.Impl) => void) => () => void
      /**
       * Sets the context of the state machine.
       */
      setContext: Machine.SetContext.Impl
    }
  }

  /**
   * State machine definition.
   * 
   * @template Self The type of the state machine definition.
   * @template States (Internal) The type of the state machine states.
   * @template ContextSchema (Internal) The type of the state machine context schema.
   * @template HasContextSchema (Internal) A boolean indicating whether the state machine has a context schema.
   */
  export type Definition<
    Self,
    States = A.Get<Self, "states">,
    ContextSchema = A.Get<Self, ["schema", "context", $$t]>,
    HasContextSchema = Self extends { schema: { context: unknown } } ? true : false
  > =
    & { initial:
          // if (there are type errors) {
          //   throw an error
          // } else if (there are no states defined) {
          //   throw an error
          // }
          // else {
          //  return the initial state value.
          // 
          A.IsUnknown<States> extends true ? (
            LS.ConcatAll<
              [ "Oops you have met a TypeScript limitation, "
              , "please add `on: {}` to state nodes that only have an `effect` property. "
              , "See the documentation to learn more."
              ]>
          ) : [keyof States] extends [never] ? (
            A.CustomError<
              "Error: no states defined",
              A.Get<Self, "initial">>
          ) : (
            keyof States
          )
        states:
          { [StateIdentifier in keyof States]:
              // if (the state identifier is a string) {
              //   return the state node
              // } else {
              //   throw an error
              // }
              StateIdentifier extends A.String ? (
                Definition.StateNode<Self, ["states", StateIdentifier]>
              ) : (
                A.CustomError<
                  "Error: Only string identifiers allowed",
                  States[StateIdentifier]>
              )
          }
        on?: Definition.On<Self, ["on"]>
        schema?: Definition.Schema<Self, ["schema"]>
        verbose?: boolean
        console?: ConsoleInterface
        $$internalIsConstraint?:
          A.CustomError<
            "Error: Ignore, it's for internal types usage",
            A.Get<Self, "$$internalIsConstraint">>
      }
    & ( // if (there is no context schema) {
        //   if (there is a pre-defined context schema) {
        //     return an object with an undefined context property
        //   } else {
        //     return an object with an unknown context property
        //   }
        // } else {
        //   return the context schema
        // }
        ContextSchema extends undefined ? (
          HasContextSchema extends true ? (
            { context?: undefined }
          ) : (
            { context?: unknown }
          )
        ) : (
          { context: ContextSchema }
        )
      );

  /**
   * Collections of types and interfaces for the state machine definition.
   */
  export namespace Definition {
    /**
     * State machine definition for internal usage.
     */
    export type Impl = {
      /**
       * The initial state value.
       */
      initial: StateValue.Impl
      /**
       * The state machine states.
       */
      states: R.Of<StateValue.Impl, Definition.StateNode.Impl>
      /**
       * The state machine transitions.
       */
      on?: Definition.On.Impl
      /**
       * The state machine schema.
       * This property is used only for type inference.
       */
      schema?: {
        /**
         * The state machine context schema.
         */
        context?: null
        /**
         * The state machine events schema.
         */
        events?: R.Of<Event.Impl["type"], null>
      }
      /**
       * A boolean indicating whether logging is enabled.
       */
      verbose?: boolean
      /**
       * The console object.
       */
      console?: ConsoleInterface
      /**
       * The state machine context.
       */
      context?: Context.Impl
    };

    /**
     * Infer the state machine definition from a type parameter.
     * 
     * @template D The type of the state machine definition.
     */
    export type FromTypeParamter<D> =
      // TODO(tai-kun): Check whether "$$internalIsConstraint" is a really necessary property.
      "$$internalIsConstraint" extends keyof D ? (
        D extends infer X ? (
          X extends Definition<infer X> ? (
            X
          ) : (
            never
          )
        ) : (
          never
        )
      ) : (
        D
      );

    /**
     * State node in the state machine definition.
     * 
     * @template D The type of the state machine definition.
     * @template P The path to the state node from the root of the state machine definition.
     */
    export type StateNode<D, P> = {
      on?: On<D, L.Concat<P, ["on"]>>
      effect?: Effect<D, L.Concat<P, ["effect"]>>
    };

    /**
     * Collections of types and interfaces for the state node in the state machine definition.
     */
    export namespace StateNode {
      /**
       * State node in the state machine definition for internal usage.
       */
      export type Impl = {
        /**
         * The state machine transitions.
         */
        on?: On.Impl
        /**
         * A side effect function that should be executed when transitioning to the current state.
         */
        effect?: Effect.Impl
      };
    }

    /**
     * Transitions in the state machine definition.
     * 
     * @template D The type of the state machine definition.
     * @template P The path to the transitions from the root of the state machine definition.
     * @template Self (Internal) The type of itself.
     * @template EventsSchema (Internal) The type of the state machine events schema.
     * @template EventTypeConstraint (Internal) The type of the event type constraint.
     */
    export type On<
      D, P,
      Self = A.Get<D, P>,
      EventsSchema = A.Get<D, ["schema", "events"], {}>,
      EventTypeConstraint =
        A.Get<EventsSchema, ExhaustiveIdentifier, false> extends true
          ? U.Exclude<keyof EventsSchema, ExhaustiveIdentifier>
          : A.String
    > = {
      [EventType in keyof Self]:
        // if (the event type is not a string) {
        //   throw an error
        // } else if (the event type is a reserved name "$$exhaustive") {
        //   throw an error
        // } else if (the event type is a reserved name "$$initial") {
        //   throw an error
        // } else if (the event type is not found in the events schema) {
        //   throw an error
        // } else {
        //   return the transition
        // }
        A.DoesExtend<EventType, A.String> extends false ? (
          A.CustomError<"Error: only string types allowed", A.Get<Self, EventType>>
        ) : EventType extends ExhaustiveIdentifier ? (
          A.CustomError<
            `Error: '${ExhaustiveIdentifier}' is a reserved name`,
            A.Get<Self, EventType>>
        ) : EventType extends InitialEventType ? (
          A.CustomError<
            `Error: '${InitialEventType}' is a reserved type`,
            A.Get<Self, EventType>>
        ) : A.DoesExtend<EventType, EventTypeConstraint> extends false ? (
          A.CustomError<
            LS.ConcatAll<
              [ `Error: Event type '${S.Assert<EventType>}' is not found in schema.events `
              , "which is marked as exhaustive"
              ]>,
            A.Get<Self, EventType>>
        ) : (
          Transition<D, L.Concat<P, [EventType]>>
        )
    };

    /**
     * Collections of types and interfaces for the transitions in the state machine definition.
     */
    export namespace On {
      /**
       * Transitions in the state machine definition for internal usage.
       */
      export type Impl = R.Of<Event.Impl["type"], Transition.Impl>;
    }

    /**
     * A transition in the state machine definition.
     * 
     * @template D The type of the state machine definition.
     * @template P The path to the transitions from the root of the state machine definition.
     * @template TargetString (Internal) The type of the target state value.
     * @template Event (Internal) The type of the event.
     */
    export type Transition<
      D, P,
      TargetString = Machine.StateValue<D>,
      Event = { type: L.Pop<P> }
    > =
      | TargetString
      | {
          target: TargetString
          guard?: (
            parameter: {
              context: Machine.Context<D>
              event: U.Extract<Machine.Event<D>, Event>
            }
          ) => boolean
        };

    /**
     * Collections of types and interfaces for the transition in the state machine definition.
     */
    export namespace Transition {
      /**
       * A transition in the state machine definition for internal usage.
       */
      export type Impl =
        | State.Impl["value"]
        | {
            /**
             * The target state value.
             */
            target: State.Impl["value"]
            /**
             * A guard function that should return a boolean indicating whether the transition should be taken.
             */
            guard?: (
              parameter: {
                context: State.Impl["context"]
                event: State.Impl["event"]
              }
            ) => boolean
          };
    }

    /**
     * A side effect function that is executed when transitioning to the current state.
     * 
     * @template D The type of the state machine definition.
     * @template P The path to the side effect function from the root of the state machine definition.
     * @template StateValue (Internal) The type of the state value.
     * @param parameter The parameter for the side effect function.
     * @returns A cleanup function for the side effect function or `undefined`.
     */
    export type Effect<
      D, P,
      StateValue = L.Pop<L.Popped<P>>
    > = (parameter: Machine.Definition.Effect.Parameter.ForStateValue<D, StateValue>) => (
      | void
      | ((parameter: Machine.Definition.Effect.Parameter.Cleanup.ForStateValue<D, StateValue>) => void)
    );

    /**
     * Collections of types and interfaces for the side effect function in the state machine definition.
     */
    export namespace Effect {
      /**
       * A side effect function that is executed when transitioning to the current state for internal usage.
       * 
       * @param parameter The parameter for the side effect function.
       * @returns A cleanup function for the side effect function or `undefined`.
       */
      export type Impl = (parameter: Machine.Definition.Effect.Parameter.Impl) => (
        | void
        | ((parameter: Machine.Definition.Effect.Parameter.Cleanup.Impl) => void)
      );

      /**
       * Collections of types and interfaces for effect parameters.
       */
      export namespace Parameter {
        /**
         * The basic effect parameter.
         * 
         * @template D The type of the state machine definition.
         */
        export interface Base<D> {
          /**
           * The send function to send an event to the state machine.
           */
          send: Machine.Send<D>
          /**
           * The current context of the state machine.
           */
          context: Machine.Context<D>
          /**
           * The function to update the context of the state machine.
           */
          setContext: Machine.SetContext<D>
        }

        /**
         * The effect parameter for a state value.
         * 
         * @template D The type of the state machine definition.
         * @template StateValue The state value.
         */
        export interface ForStateValue<D, StateValue>
          extends Base<D> {
          /**
           * The event that triggered the effect.
           */
          event: Machine.EntryEventForStateValue<D, StateValue>
        }

        /**
         * The effect parameter for a state value for internal usage.
         */
        export type Impl = {
          /**
           * The send function to send an event to the state machine.
           */
          send: Send.Impl
          /**
           * The event that triggered the effect.
           */
          event: Event.Impl
          /**
           * The current context of the state machine.
           */
          context: Context.Impl
          /**
           * The function to update the context of the state machine.
           */
          setContext: SetContext.Impl
        }

        /**
         * Collections of types and interfaces for the cleanup effect parameter.
         */
        export namespace Cleanup {
          /**
           * The effect cleanup parameter for a state value.
           * 
           * @template D The type of the state machine definition.
           * @template StateValue The state value.
           */
          export interface ForStateValue<D, StateValue> extends Base<D> {
            /**
             * The event that triggered the cleanup effect.
             */
            event: Machine.ExitEventForStateValue<D, StateValue>
          }
          
          /**
           * The effect cleanup parameter for a state value for internal usage.
           */
          export type Impl = {
            /**
             * The send function to send an event to the state machine.
             */
            send: Send.Impl
            /**
             * The event that triggered the cleanup effect.
             */
            event: Event.Impl
            /**
             * The current context of the state machine.
             */
            context: Context.Impl
            /**
             * The function to update the context of the state machine.
             */
            setContext: SetContext.Impl
          }
        }
      }
    }

    /**
     * The state machine schema.
     * 
     * @template D The type of the state machine definition.
     * @template P The path to the state machine schema from the root of the state machine definition.
     * @template Self (Internal) The type of itself.
     * @template ContextSchema (Internal) The type of the state machine context schema.
     * @template EventsSchema (Internal) The type of the state machine events schema.
     */
    export type Schema<
      D, P,
      Self = A.Get<D, P>,
      ContextSchema = A.Get<Self, "context">,
      EventsSchema = A.Get<Self, "events">
    > = {
      context?:
        A.DoesExtend<ContextSchema, { [$$t]: unknown }> extends false ? (
          A.CustomError<
            "Error: Use `t` to define type, eg `t<{ foo: number }>()`",
            ContextSchema>
        ) : (
          ContextSchema
        )
      events?: {
        [Type in keyof EventsSchema]:
          // if (the event type is a reserved name "$$exhaustive") {
          //   return boolean
          // } else if (the event type is a reserved name "$$initial") {
          //   throw an error
          // } else if (the event type is not a string) {
          //   throw an error
          // } else if (the event is defineded by `t()` function) {
          //   if (the wrapped payload is not an object containing a `$$t` property) {
          //     throw an error
          //   } else if (the payload is not a plain object) {
          //     throw an error
          //   } else if (the payload has a property `type`) {
          //     throw an error
          //   } else {
          //     return the event
          //   }
          // } else {
          //   return never
          // }
          Type extends Definition.ExhaustiveIdentifier ? (
            boolean
          ) : Type extends Definition.InitialEventType ? (
            A.CustomError<
              `Error: '${Definition.InitialEventType}' is a reserved type`,
              A.Get<EventsSchema, Type>>
          ) : A.DoesExtend<Type, A.String> extends false ? (
            A.CustomError<
              "Error: Only string types allowed",
              A.Get<EventsSchema, Type>>
          ) : A.Get<EventsSchema, Type> extends infer PayloadWrapped ? (
            A.DoesExtend<PayloadWrapped, { [$$t]: unknown }> extends false ? (
              A.CustomError<
                "Error: Use `t` to define payload type, eg `t<{ foo: number }>()`",
                A.Get<EventsSchema, Type>>
            ) : A.Get<PayloadWrapped, $$t> extends infer Payload ? (
              A.IsPlainObject<Payload> extends false ? (
                A.CustomError<
                  "Error: An event payload should be an object, eg `t<{ foo: number }>()`",
                  A.Get<EventsSchema, Type>>
              ) : "type" extends keyof Payload ? (
                A.CustomError<
                  LS.ConcatAll<
                    [ "Error: An event payload cannot have a property `type` as it's already defined. "
                    , `In this case as '${S.Assert<Type>}'`
                    ]>,
                    A.Get<EventsSchema, Type>> 
              ) : (
                A.Get<EventsSchema, Type>
              )
            ) : (
              never
            )
          ) : (
            never
          )
      }
    };

    export type ExhaustiveIdentifier = "$$exhaustive";
    export type InitialEventType = "$$initial";
  }

  /**
   * State machine state values.
   * 
   * @template D The type of the state machine definition.
   */
  export type StateValue<D> = keyof A.Get<D, "states">;

  /**
   * Collections of types and interfaces for the state machine state values.
   */
  export namespace StateValue {
    /**
     * State machine state values for internal usage.
     */
    export type Impl = string & A.Tag<"Machine.StateValue">;
  }

  /**
   * The initial state value.
   * 
   * @template D The type of the state machine definition.
   */
  export type InitialStateValue<D> = A.Get<D, "initial">;

  /**
   * The context of the state machine.
   * 
   * @template D The type of the state machine definition.
   */
  export type Context<D> =
    A.Get<D, ["schema", "context", $$t], A.Get<D, "context">>;

  /**
   * Collections of types and interfaces for the context of the state machine.
   */
  export namespace Context {
    /**
     * The context of the state machine for internal usage.
     */
    export type Impl = {} & A.Tag<"Machine.Context">;
  }

  /**
   * The event of the state machine.
   * 
   * @template D The type of the state machine definition.
   * @template EventsSchema (Internal) The type of the state machine events schema.
   */
  export type Event<
    D,
    EventsSchema = A.Get<D, ["schema", "events"], {}>
  > = 
    | O.Value<{
        [T in U.Exclude<keyof EventsSchema, Definition.ExhaustiveIdentifier>]:
          // if (the event schema is valid) {
          //   return the event
          // } else {
          //   return never
          // }
          A.Get<EventsSchema, [T, $$t]> extends infer E ? (
            E extends any ? (
              O.ShallowClean<{ type: T } & E>
            ) : (
              never
            )
          ) : (
            never
          )
      }>
    | (
        A.Get<EventsSchema, Definition.ExhaustiveIdentifier, false> extends true ? (
          never
        ) : (
          (
            | (
                O.Value<{
                  [S in keyof A.Get<D, "states">]: keyof A.Get<D, ["states", S, "on"]>
                }> extends infer EventType ? (
                  EventType extends any ? (
                    { type: EventType }
                  ) : (
                    never
                  )
                ) : (
                  never
                )
              )
            | (
                keyof A.Get<D, "on"> extends infer EventType ? (
                  EventType extends any ? (
                    { type: EventType }
                  ) : (
                    never
                  )
                ) : (
                  never
                )
              )
          ) extends infer InferredEvent ? (
            InferredEvent extends any ? (
              A.Get<InferredEvent, "type"> extends keyof EventsSchema              ? never :
              A.Get<InferredEvent, "type"> extends Definition.ExhaustiveIdentifier ? never :
              A.Get<InferredEvent, "type"> extends Definition.InitialEventType     ? never :
              InferredEvent
            ) : (
              never
            )
          ) : (
            never
          )
        )
      )

  /**
   * Collections of types and interfaces for the event of the state machine.
   */
  export namespace Event {
    /**
     * The event of the state machine for internal usage.
     */
    export type Impl = {
      /**
       * The type of the event.
       */
      type: string & A.Tag<"Machine.Event['type']">
    };
  }

  /**
   * The entry (effect) event for a state value.
   * 
   * @template D The type of the state machine definition.
   * @template StateValue The state value.
   */
  export type EntryEventForStateValue<D, StateValue> =
    | (
        // if (the state value is the initial state value) {
        //   return the initial event type
        // } else {
        //   return never
        // }
        StateValue extends InitialStateValue<D> ? (
          { type: Definition.InitialEventType }
        ) : (
          never
        )
      )
    | U.Extract<
        Event<D>,
        {
          type:
            | O.Value<{
                [S in keyof A.Get<D, "states">]: O.Value<{
                  [E in keyof A.Get<D, ["states", S, "on"]>]:
                    // if (found the event type for the state value in the state node) {
                    //   return the event type
                    // } else {
                    //   return never
                    // }
                    A.Get<D, ["states", S, "on", E]> extends infer T ? (
                      (T extends A.String ? T : A.Get<T, "target">) extends StateValue ? (
                        E
                      ) : (
                        never
                      )
                    ) : (
                      never
                    )
                }>
              }>
            | O.Value<{
                [E in keyof A.Get<D, ["on"]>]:
                  // if (found the event type for the state value in the state machine) {
                  //   return the event type
                  // } else {
                  //   return never
                  // }
                  A.Get<D, ["on", E]> extends infer T ? (
                    (T extends A.String ? T : A.Get<T, "target">) extends StateValue ? (
                      E
                    ) : (
                      never
                    )
                  ) : (
                    never
                  )
              }>
        }
      >

  /**
   * The exit (effect-cleanup) event for a state value.
   * 
   * @template D The type of the state machine definition.
   * @template StateValue The state value.
   */
  export type ExitEventForStateValue<D, StateValue> =
    U.Extract<
      Machine.Event<D>,
      {
        type:
          // event types for the state value in the state node
          | keyof A.Get<D, ["states", StateValue, "on"], {}>
          // event types for the state value in the state machine
          | keyof A.Get<D, "on", {}>
      }
    >

  /**
   * Sendarble event for a state value.
   * 
   * @template D The type of the state machine definition.
   * @template E (Internal) The type of the event.
   */
  export type Sendable<D, E = Machine.Event<D>> =
    | (
        // if (the event has a type property) {
        //   return the event type
        // } else {
        //   return never
        // }
        E extends any ? (
          { type: A.Get<E, "type"> } extends E ? (
            A.Get<E, "type">
          ) : (
            never
          )
        ) : (
          never
        )
      )
    | E

  /**
   * Collections of types and interfaces for the sendable event for a state value.
   */
  export namespace Sendable {
    /**
     * Sendable event for a state value for internal usage.
     */
    export type Impl = 
      | Event.Impl["type"]
      | Event.Impl;
  }

  /**
   * Sends an event to the state machine.
   * 
   * @template D The type of the state machine definition.
   */
  export type Send<D> = {
    /**
     * Sends an event to the state machine.
     * 
     * @param sendable The event to send to the state machine.
     */
    (sendable: U.Exclude<Sendable<D>, A.String>): void
    /**
     * Sends an event to the state machine.
     * 
     * @param sendable The event to send to the state machine.
     */
    (sendable: U.Extract<Sendable<D>, A.String>): void
  };

  /**
   * Collections of types and interfaces for the send function of the state machine.
   */
  export namespace Send {
    /**
     * Sends an event to the state machine for internal usage.
     * 
     * @param sendable The event to send to the state machine.
     */
    export type Impl = (send: Sendable.Impl) => void;
  }

  /**
   * Sets the context of the state machine.
   * 
   * @template D The type of the state machine definition.
   * @param contextUpdater The function to update the context of the state machine.
   * @returns An object with the send function to send an event to the state machine.
   */
  export type SetContext<D> = (contextUpdater: ContextUpdater<D>) => {
    /**
     * Sends an event to the state machine.
     */
    send: Send<D>
  };

  /**
   * Collections of types and interfaces for the set context function of the state machine.
   */
  export namespace SetContext {
    /**
     * Sets the context of the state machine for internal usage.
     * 
     * @param contextUpdater The function to update the context of the state machine.
     * @returns An object with the send function to send an event to the state machine.
     */
    export type Impl = (context: ContextUpdater.Impl) => {
      /**
       * Sends an event to the state machine.
       */
      send: Send.Impl
    };
  }

  /**
   * Updates the context of the state machine.
   * 
   * @template D The type of the state machine definition.
   * @param context The current context of the state machine.
   * @returns The updated context of the state machine.
   */
  export type ContextUpdater<D> = (context: Context<D>) => Context<D>;

  /**
   * Collections of types and interfaces for the context updater of the state machine.
   */
  export namespace ContextUpdater {
    /**
     * Updates the context of the state machine for internal usage.
     * 
     * @param context The current context of the state machine.
     * @returns The updated context of the state machine.
     */
    export type Impl = (context: Context.Impl) => Context.Impl
  }

  /**
   * The state of the state machine.
   * 
   * @template D The type of the state machine definition.
   * @template Value (Internal) The type of the state value.
   * @template NextEvents (Internal) The type of the next events.
   */
  export type State<
    D,
    Value = StateValue<D>,
    NextEvents =
      (
        // if (the state value has a next event) {
        //   return the next event
        // } else {
        //   return never
        // }
        Value extends any ? (
          A.Get<ExitEventForStateValue<D, Value>, "type">
        ) : (
          never
        )
      )[]
  > =
    // if (the state value is valid) {
    //   return the state
    // } else {
    //   return never
    // }
    Value extends any ? (
      {
        value: Value
        context: Context<D>
        event: EntryEventForStateValue<D, Value>
        nextEventsT: A.Get<ExitEventForStateValue<D, Value>, "type">[]
        nextEvents: NextEvents
      }
    ) : (
      never
    )

  /**
   * Collections of types and interfaces for the state of the state machine.
   */
  export namespace State {
    /**
     * The state of the state machine for internal usage.
     */
    export type Impl = {
      /**
       * The current state value.
       */
      value: StateValue.Impl
      /**
       * The current context of the state machine.
       */
      context: Context.Impl
      /**
       * The event that triggered the state.
       */
      event: Event.Impl
      /**
       * The next events that can be sent to the state machine.
       */
      nextEvents: Event.Impl["type"][]
      /**
       * The next events that can be sent to the state machine.
       */
      nextEventsT: Event.Impl["type"][]
    }
  }
}

/**
 * Collections of type utilities for list.
 */
export namespace L {
  /**
   * Asserts that a type is a tuple.
   * 
   * @template T The type to assert.
   */
  export type Assert<T> = A.Cast<T, A.Tuple>;

  /**
   * Concatenates two tuples.
   * 
   * @template A The tuple.
   * @template B The other tuple.
   */
  export type Concat<A, B> = [...L.Assert<A>, ...L.Assert<B>]

  /**
   * Infer the type of tuple that popped the last element.
   * 
   * @template A The tuple.
   */
  export type Popped<A> = A extends [] ? [] : A extends [...infer X, any] ? X : never;

  /**
   * Infer the last element of a tuple.
   * 
   * @template A The tuple.
   */
  export type Pop<A> = A extends [] ? undefined : A extends [...any[], infer X] ? X : never; 
}

/**
 * Collections of type utilities for list and string.
 */
export namespace LS {
  /**
   * Concatenates all the elements of a tuple.
   * 
   * @template L The tuple.
   */
  export type ConcatAll<L> =
    L extends [] ? [] :
    L extends [infer H] ? H :
    L extends [infer H, ...infer T] ? `${S.Assert<H>}${S.Assert<ConcatAll<T>>}` :
    never
}

/**
 * Collections of type utilities for string.
 */
export namespace S {
  /**
   * Asserts that a type is a string.
   * 
   * @template T The type to assert.
   */
  export type Assert<T> = A.Cast<T, A.String>;

  /**
   * Returns `true` if the type is a literal string, `false` otherwise.
   * 
   * @template T The type to check.
   */
  export type IsLiteral<T> =
    T extends A.String
      ? A.String extends T
          ? false
          : true
      : false;
}

/**
 * Collections of general type utilities.
 */
export namespace U {
  /**
   * Extract from `T` those types that are assignable to `U`.
   * 
   * @template T The type to extract from.
   * @template U The type to extract.
   */
  export type Extract<T, U> = T extends U ? T : never;

  /**
   * Exclude from `T` those types that are assignable to `U`.
   * 
   * @template T The type to exclude from.
   * @template U The type to exclude.
   */
  export type Exclude<T, U> = T extends U ? never : T;
}

/**
 * Collections of type utilities for object.
 */
export namespace O {
  /**
   * Get all the values of an object.
   * 
   * @template T The object type.
   */
  export type Value<T> = T[keyof T];

  /**
   * Simplifies an object type.
   * 
   * @template T The object type.
   */
  export type ShallowClean<T> = { [K in keyof T]: T[K] }
}

export namespace A {
  /**
   * Casts a type to another type if possible.
   * 
   * @template T The type to cast.
   * @template U The type to cast to.
   */
  export type Cast<T, U> = T extends U ? T : U;

  /**
   * Tuple type.
   * 
   * @template T The type of items in the tuple.
   */
  export type Tuple<T = any> = T[] | [T];

  /**
   * Object type.
   */
  export type Object = object;

  /**
   * String type.
   */
  export type String = string;

  /**
   * Function type.
   */
  export type Function = (...args: any[]) => any;

  /**
   * Infer the narrowest type of `T`.
   * 
   * @template T The type to infer.
   */
  export type InferNarrowest<T> =
    T extends any
      ? (
          T extends A.Function ? T :
          T extends { [$$t]: unknown } ? T :
          T extends A.Object ? InferNarrowestObject<T> :
          T
        )
      : never

  /**
   * Infer the narrowest type of an object.
   * 
   * @template T The object type.
   */
  export type InferNarrowestObject<T> = {
    readonly [K in keyof T]: InferNarrowest<T[K]>
  }

  /**
   * Returns `true` if `A` and `B` are equal, `false` otherwise.
   * 
   * @template A The first type.
   * @template B The second type.
   */
  export type AreEqual<A, B> =
    (<T>() => T extends B ? 1 : 0) extends (<T>() => T extends A ? 1 : 0)
      ? true
      : false;

  /**
   * Returns `true` if `A` extends `B`, `false` otherwise.
   * 
   * @template A The first type.
   * @template B The second type.
   */
  export type DoesExtend<A, B> = A extends B ? true : false;

  /**
   * Returns `true` if `T` is unknown, `false` otherwise.
   * 
   * @template T The type to check.
   */
  export type IsUnknown<T> =
    [T] extends [never]
      ? false
      : T extends unknown ? unknown extends T
          ? true
          : false : false;

  /**
   * Returns `true` if `T` is a plain object, `false` otherwise.
   * 
   * @template T The type to check.
   */
  export type IsPlainObject<T> =
    T extends A.Object
      ? T extends A.Function ? false :
        T extends A.Tuple ? false :
        true
      : false

  /** @see {@link Get} */
  type _Get<T, P, F> =
    P extends [] ?
      T extends undefined ? F : T :
    P extends [infer K1, ...infer Kr] ?
      K1 extends keyof T ?
        _Get<T[K1], Kr, F> :
      K1 extends Get.Returned$$ ?
        _Get<T extends (...a: any[]) => infer R ? R : undefined, Kr, F> :
      K1 extends Get.Parameters$$ ?
        _Get<T extends (...a: infer A) => any ? A : undefined, Kr, F> :
      F :
    never

  /**
   * Get the value of path `P` in object `T`.
   * 
   * @template T The object type.
   * @template P The path type.
   * @template F The fallback type. (default: `undefined`)
   */
  export type Get<T, P, F = undefined> =
    (P extends any[] ? _Get<T, P, F> : _Get<T, [P], F>) extends infer X
      ? A.Cast<X, any>
      : never

  /**
   * Collections of types and interfaces for the `Get` type utility.
   */
  export namespace Get {
    declare const _Returned$$: unique symbol;
    export type Returned$$ = typeof _Returned$$;

    declare const _Parameters$$: unique symbol;
    export type Parameters$$ = typeof _Parameters$$;
  }

  /**
   * Returns a custom error type.
   * 
   * @template Error The error type.
   * @template Place The place where the error occurred.
   */
  export type CustomError<Error, Place> =
    Place extends (S.IsLiteral<Place> extends true ? Error : A.String)
      ? Place extends `${S.Assert<Error>} `
          ? Error
          : `${S.Assert<Error>} `
      : Error

  /**
   * Branded type.
   * 
   * @template N The brand name.
   */
  export type Tag<N extends A.String> = { [_ in N]: void }

  export const test = (_o: true) => {};
  export const areEqual = <A, B>(_debug?: (value: A) => void) => undefined as any as A.AreEqual<A, B>
}

/**
 * Interface for a console object.
 */
export type ConsoleInterface = {
  /**
   * Logs a message to the console.
   *
   * @param format A `printf`-like format string.
   * @param param The parameter to log.
   */
  readonly log: (format: string, param: string | object) => void;
  /**
   * Increases indentation of subsequent lines by spaces for `groupIndentation`length.
   *
   * @param label If one or more `label`s are provided, those are printed first without the additional indentation.
   */
  readonly group?: ((...label: string[]) => void) | undefined;
  /**
   * An alias for {@link group}.
   */
  readonly groupCollapsed?: ((...label: string[]) => void) | undefined;
  /**
   * Decreases indentation of subsequent lines by spaces for `groupIndentation`length.
   */
  readonly groupEnd?: (() => void) | undefined;
};

/* -----------------------------------------------------------------------------
 *
 * See https://github.com/cassiozen/useStateMachine/blob/main/src/extra.ts
 *
 * -------------------------------------------------------------------------- */

export namespace R {
  /**
   * Get the value of a key in an object.
   *
   * @template O The object type.
   * @param o The object from which to retrieve the value.
   * @param k The key whose value is to be retrieved.
   * @returns The value of the key, or `undefined` if the key does not exist.
   */
  export function get<O extends R.Unknown>(
    o: O,
    k: R.Key<O>,
  ): R.Value<O> | undefined {
    return (o as any)[k];
  }

  /**
   * Concatenates two objects.
   *
   * @template O1 The first object type.
   * @template O2 The second object type.
   * @param o1 The first object to concatenate.
   * @param o2 The second object to concatenate.
   * @returns The concatenated object resulting from merging the properties of o1 and o2.
   */
  export function concat<O1 extends R.Unknown, O2 extends R.Unknown>(
    o1: O1,
    o2: O2,
  ): R.Concat<O1, O2> {
    return {
      ...o1,
      ...o2,
    };
  }

  /**
   * Returns the value of an object, or an empty object type as `O` if the object is `undefined`.
   *
   * @template O The object type.
   * @param o The object to return, or `undefined`.
   * @returns
   */
  export function fromMaybe<O extends R.Unknown>(o: O | undefined): O {
    return o ?? ({} as O);
  }

  /**
   * Returns the keys of an object.
   *
   * @template O The object type.
   * @param o The object from which to retrieve the keys.
   * @returns An array of the keys of the object.
   */
  export function keys<O extends R.Unknown>(o: O): R.Key<O>[] {
    return Object.keys(o);
  }

  declare const _$$K: unique symbol;
  declare const _$$V: unique symbol;

  /**
   * A type that represents the key of a key-value pair.
   */
  export type $$K = typeof _$$K;

  /**
   * A type that represents the value of a key-value pair.
   */
  export type $$V = typeof _$$V;

  /**
   * A type that represents a key-value pair.
   *
   * @template K The key type.
   * @template V The value type.
   */
  export type Of<K extends string, V> = { [_$$K]: K; [_$$V]: V };

  /**
   * A type that represents a key-value pair with unknown key.
   */
  export type Unknown = Of<string, unknown>;

  /**
   * Extracts the key type from a key-value pair.
   *
   * @template O The key-value pair type.
   */
  export type Key<O extends R.Unknown> = O[$$K];

  /**
   * Extracts the value type from a key-value pair.
   *
   * @template O The key-value pair type.
   */
  export type Value<O extends R.Unknown> = O[$$V];

  /**
   * Concatenates two key-value pairs.
   *
   * @template O1 The first key-value pair type.
   * @template O2 The second key-value pair type.
   */
  export type Concat<O1 extends R.Unknown, O2 extends R.Unknown> = R.Of<
    R.Key<O1> | R.Key<O2>,
    R.Value<O1> | R.Value<O2>
  >;
}
