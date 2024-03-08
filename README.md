<p align="center">
<img src="https://user-images.githubusercontent.com/33676/111815108-4695b900-88a9-11eb-8b61-3c45b40d4df6.png" width="250" alt=""/>
</p>

**The <1 KiB _state machine_ hook for React:**

[![Test](https://github.com/tai-kun/useStateMachine/actions/workflows/test.yaml/badge.svg)](https://github.com/tai-kun/useStateMachine/actions/workflows/test.yaml)
[![Release on NPM](https://github.com/tai-kun/useStateMachine/actions/workflows/release.yaml/badge.svg)](https://github.com/tai-kun/useStateMachine/actions/workflows/release.yaml)
[![Canary Release on NPM](https://github.com/tai-kun/useStateMachine/actions/workflows/canary-release.yaml/badge.svg)](https://github.com/tai-kun/useStateMachine/actions/workflows/canary-release.yaml)

[![npm version](https://img.shields.io/npm/v/@tai-kun/use-state-machine)](https://www.npmjs.com/package/@tai-kun/use-state-machine)
![npm canary version](https://img.shields.io/npm/v/@tai-kun/use-state-machine/canary)

[![License: MIT](https://img.shields.io/badge/License-MIT-red.svg)](https://opensource.org/licenses/MIT)

See the user-facing docs at: [usestatemachine.js.org](https://usestatemachine.js.org/)

- Batteries Included: Despite the tiny size, useStateMachine is feature complete (Entry/exit callbacks, Guarded transitions & Extended State - Context)
- Amazing TypeScript experience: Focus on automatic type inference (auto completion for both TypeScript & JavaScript users without having to manually define the typings) while giving you the option to specify and augment the types for context & events.
- Made for React: useStateMachine follow idiomatic React patterns you and your team are already familiar with. (The library itself is actually a thin wrapper around React's useState & useEffect.)

| Signature | Format | Size (minified + brotlied) | Size (minified + gzipped) |
| :-------- | :----: | -------------------------: | ------------------------: |
| `import * from "@tai-kun/use-state-machine/default"`  | **ESM** | **982 B**   | 1.04 KB   |
| "                                                     |   CJS   | 1.37  KB    | 1.47 KB   |
| `import * from "@tai-kun/use-state-machine/external"` | **ESM** | **950 B**   | 1.03 KB   |
| "                                                     |   CJS   | 1.34 KB     | 1.45 KB   |
| `import * from "@tai-kun/use-state-machine/synced"`   |   ESM   | 1.09 KB     | 1.17 KB   |
| "                                                     |   CJS   | 1.51 KB     | 1.62 KB   |
| `import * from "@tai-kun/use-state-machine"`          |   ESM   | 1.35 KB     | 1.45 KB   |
| "                                                     |   CJS   | 1.77 KB     | 1.91 KB   |

## Examples

- State-driven UI (Hiding and showing UI Elements based on the state) - [CodeSandbox](https://codesandbox.io/s/github/cassiozen/usestatemachine/tree/main/examples/timer?file=/index.tsx) - [Source](./examples/timer)
- Async orchestration (Fetch data with limited retry) - [CodeSandbox](https://codesandbox.io/s/github/cassiozen/usestatemachine/tree/main/examples/fetch?file=/index.tsx) - [Source](./examples/fetch)
- Sending data with events (Form) - [CodeSandbox](https://codesandbox.io/s/github/cassiozen/usestatemachine/tree/main/examples/form?file=/index.tsx) - [Source](./examples/form)

## Installation

```bash
npm install @tai-kun/use-state-machine
```

## Sample Usage

```ts
const [state, send] = useStateMachine({
  initial: "inactive",
  states: {
    inactive: {
      on: { TOGGLE: "active" },
    },
    active: {
      on: { TOGGLE: "inactive" },
      effect() {
        console.log("Just entered the Active state");
        // Same cleanup pattern as `useEffect`:
        // If you return a function, it will run when exiting the state.
        return () => console.log("Just Left the Active state");
      },
    },
  },
});

console.log(state); // { value: 'inactive', nextEvents: ['TOGGLE'] }

// Refers to the TOGGLE event name for the state we are currently in.

send("TOGGLE");

// Logs: Just entered the Active state

console.log(state); // { value: 'active', nextEvents: ['TOGGLE'] }
```

# API

- [useStateMachine](#usestatemachine)
- [useExternalStateMachine](#useexternalstatemachine)
- [useSyncedStateMachine](#usesyncedstatemachine)
- [createStateMachine](#createstatemachine)

## useStateMachine

```ts
const [state, send] = useStateMachine(/* State Machine Definition */);
```

`useStateMachine` takes a JavaScript object as the state machine definition. It returns an array consisting of a `current machine state` object and a `send` function to trigger transitions.

### state

The machine's `state` consists of 4 properties: `value`, `event`, `nextEvents` and `context`.

`value` (`string`): Returns the name of the current state.

`event` (`{type: string}`; Optional): The name of the last sent event that led to this state.

`nextEvents` (`string[]`): An array with the names of available events to trigger transitions from this state.

`context`: The state machine extended state. See "Extended State" below.

### Send events

`send` takes an event as argument, provided in shorthand string format (e.g. "TOGGLE") or as an event object (e.g. `{ type: "TOGGLE" }`)

If the current state accepts this event, and it is allowed (see guard), it will change the state machine state and execute effects.

You can also send additional data with your event using the object notation (e.g. `{ type: "UPDATE" value: 10 }`). Check [schema](#schema-context--event-typing) for more information about strong typing the additional data.

## useExternalStateMachine

Like `useStateMachine`, but uses `React.useSyncExternalStore` instead of `React.useState` to manage state.

```ts
const machine = createExternalStateMachine({
  // State Machine Definition
});

function App() {
  const [state, send] = useExternalStateMachine(machine);

  // ...
}
```

## useSyncedStateMachine

Like `useStateMachine`, but updates state directly instead of `React.useState`.
Therefore, calling the `send` function **will not trigger a re-render**.

```ts
function App() {
  const [getState, send] = useSyncedStateMachine({
    // State Machine Definition
  });
  const state = getState();

  // ...
}
```

## createStateMachine

Define a state machine to use with `useStateMachine` or `useSyncedStateMachine`.

The machine function is executed only once.
If you use dynamically changing arguments, you need to mark them as transferable values.
If there are arguments marked as transferable (by `Transfer`), they must be transferred with the `transfer` function.

```ts
function machine(staticParam: string, onChange: Transfer<Function>) {
  return createStateMachine({
    // State Machine Definition
    // context: staticParam,
    initial: "inactive",
    states: {
      inactive: {
        on: { TOGGLE: "active" },
        effect() {
          onChange.current(false);
        },
      },
      active: {
        on: { TOGGLE: "inactive" },
        effect() {
          onChange.current(true);
        },
      },
    },
  });
}

function App(props) {
  const someStaticParam = "";
  const [machineState, send] = useStateMachine(
    machine,
    someStaticParam,
    transfer(props.onChange)
  );

  // ...
}
```

# State Machine definition

| Key     | Required | Description                                                                                                                     |
| ------- | -------- | ------------------------------------------------------------------------------------------------------------------------------- |
| verbose |          | If true, will log every context & state changes. Log messages will be stripped out in the production build.                     |
| schema  |          | For usage with TypeScript only. Optional strongly-typed context & events. More on schema [below](#schema-context--event-typing) |
| context |          | Context is the machine's extended state. More on extended state [below](#extended-state-context)                                |
| initial | \*       | The initial state node this machine should be in                                                                                |
| states  | \*       | Define the possible finite states the state machine can be in.                                                                  |

## Defining States

A finite state machine can be in only one of a finite number of states at any given time. As an application is interacted with, events cause it to change state.

States are defined with the state name as a key and an object with two possible keys: `on` (which events this state responds to) and `effect` (run arbitrary code when entering or exiting this state):

### On (Events & transitions)

Describes which events this state responds to (and to which other state the machine should transition to when this event is sent):

```ts
states: {
  inactive: {
    on: {
      TOGGLE: "active";
    }
  },
  active: {
    on: {
      TOGGLE: "inactive";
    }
  },
},
```

The event definition can also use the extended, object syntax, which allows for more control over the transition (like adding guards):

```js
on: {
  TOGGLE: {
    target: 'active',
  },
};
```

#### Guards

Guards are functions that run before actually making the state transition: If the guard returns false the transition will be denied.

```js
const [state, send] = useStateMachine({
  initial: "inactive",
  states: {
    inactive: {
      on: {
        TOGGLE: {
          target: "active",
          guard({ context, event }) {
            // Return a boolean to allow or block the transition
          },
        },
      },
    },
    active: {
      on: { TOGGLE: "inactive" },
    },
  },
});
```

The guard function receives an object with the current context and the event. The event parameter always uses the object format (e.g. `{ type: 'TOGGLE' }`).

### Effects (entry/exit callbacks)

Effects are triggered when the state machine enters a given state. If you return a function from your effect, it will be invoked when leaving that state (similarly to how useEffect works in React).

```ts
const [state, send] = useStateMachine({
  initial: "active",
  states: {
    active: {
      on: { TOGGLE: "inactive" },
      effect({ send, setContext, event, context }) {
        console.log("Just entered the Active state");
        return () => console.log("Just Left the Active state");
      },
    },
  },
});
```

The effect function receives an object as parameter with four keys:

- `send`: Takes an event as argument, provided in shorthand string format (e.g. "TOGGLE") or as an event object (e.g. `{ type: "TOGGLE" }`)
- `setContext`: Takes an updater function as parameter to set a new context (more on context below). Returns an object with `send`, so you can set the context and send an event on a single line.
- `event`: The event that triggered a transition to this state. (The event parameter always uses the object format (e.g. `{ type: 'TOGGLE' }`).).
- `context` The context at the time the effect runs.

In this example, the state machine will always send the "RETRY" event when entering the error state:

```ts
const [state, send] = useStateMachine({
  initial: "loading",
  states: {
    /* Other states here... */
    error: {
      on: {
        RETRY: "load",
      },
      effect({ send }) {
        send("RETRY");
      },
    },
  },
});
```

## Extended state (context)

Besides the finite number of states, the state machine can have extended state (known as context).

You can provide the initial context value in the state machine definition, then use the `setContext` function within your effects to change the context:

```js
const [state, send] = useStateMachine({
  context: { toggleCount: 0 },
  initial: "inactive",
  states: {
    inactive: {
      on: { TOGGLE: "active" },
    },
    active: {
      on: { TOGGLE: "inactive" },
      effect({ setContext }) {
        setContext((context) => ({ toggleCount: context.toggleCount + 1 }));
      },
    },
  },
});

console.log(state); // { context: { toggleCount: 0 }, value: 'inactive', nextEvents: ['TOGGLE'] }

send("TOGGLE");

console.log(state); // { context: { toggleCount: 1 }, value: 'active', nextEvents: ['TOGGLE'] }
```

## Schema: Context & Event Typing

TypeScript will automatically infer your context type; event types are generated automatically.

Still, there are situations where you might want explicit control over the `context` and `event` types: You can provide you own typing using the `t` whithin `schema`:

_Typed Context example_

```ts
const [state, send] = useStateMachine({
  schema: {
    context: t<{ toggleCount: number }>(),
  },
  context: { toggleCount: 0 },
  initial: "inactive",
  states: {
    inactive: {
      on: { TOGGLE: "active" },
    },
    active: {
      on: { TOGGLE: "inactive" },
      effect({ setContext }) {
        setContext((context) => ({ toggleCount: context.toggleCount + 1 }));
      },
    },
  },
});
```

_Typed Events_

All events are type-infered by default, both in the string notation (`send("UPDATE")`) and the object notation (`send({ type: "UPDATE"})`).

If you want, though, you can augment an already typed event to include arbitrary data (which can be useful to provide values to be used inside effects or to update the context). Example:

```ts
const [machine, send] = useStateMachine({
  schema: {
    context: t<{ timeout?: number | undefined }>(),
    events: {
      PING: t<{ value: number }>(),
    },
  },
  context: { timeout: undefined },
  initial: "waiting",
  states: {
    waiting: {
      on: {
        PING: "pinged",
      },
    },
    pinged: {
      effect({ setContext, event }) {
        setContext((c) => ({ timeout: event?.value ?? 0 }));
      },
    },
  },
});

send({ type: "PING", value: 150 });
```

**Note** that you don't need to declare all your events in the schema, only the ones you're adding arbitrary keys and values.

# Wiki

- [Updating from version 0.x.x to 1.0](https://github.com/cassiozen/useStateMachine/wiki/Updating-from-0.X.X-to-1.0.0)
- [Contributing](https://github.com/cassiozen/useStateMachine/wiki/Contributing-to-useStateMachine)
- [Comparison with XState](https://github.com/cassiozen/useStateMachine/wiki/XState-comparison)
- [Source code walkthrough video](https://github.com/cassiozen/useStateMachine/wiki/Source-code-walkthrough-video)
- [Usage with Preact](https://github.com/cassiozen/useStateMachine/wiki/Usage-with-Preact)

# Contributors ✨

Thanks goes to these wonderful people ([emoji key](https://allcontributors.org/docs/en/emoji-key)):

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->
<table>
  <tr>
    <td align="center"><a href="http://YouTube.com/ReactCasts"><img src="https://avatars.githubusercontent.com/u/33676?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Cassio Zen</b></sub></a><br /><a href="https://github.com/cassiozen/useStateMachine/commits?author=cassiozen" title="Code">💻</a> <a href="https://github.com/cassiozen/useStateMachine/commits?author=cassiozen" title="Documentation">📖</a> <a href="https://github.com/cassiozen/useStateMachine/commits?author=cassiozen" title="Tests">⚠️</a> <a href="#ideas-cassiozen" title="Ideas, Planning, & Feedback">🤔</a> <a href="https://github.com/cassiozen/useStateMachine/issues?q=author%3Acassiozen" title="Bug reports">🐛</a></td>
    <td align="center"><a href="https://github.com/devanshj"><img src="https://avatars.githubusercontent.com/u/30295578?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Devansh Jethmalani</b></sub></a><br /><a href="https://github.com/cassiozen/useStateMachine/commits?author=devanshj" title="Code">💻</a> <a href="https://github.com/cassiozen/useStateMachine/commits?author=devanshj" title="Tests">⚠️</a> <a href="#ideas-devanshj" title="Ideas, Planning, & Feedback">🤔</a> <a href="https://github.com/cassiozen/useStateMachine/issues?q=author%3Adevanshj" title="Bug reports">🐛</a></td>
    <td align="center"><a href="https://github.com/RunDevelopment"><img src="https://avatars.githubusercontent.com/u/20878432?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Michael Schmidt</b></sub></a><br /><a href="https://github.com/cassiozen/useStateMachine/commits?author=RunDevelopment" title="Code">💻</a> <a href="https://github.com/cassiozen/useStateMachine/commits?author=RunDevelopment" title="Tests">⚠️</a> <a href="#ideas-RunDevelopment" title="Ideas, Planning, & Feedback">🤔</a></td>
    <td align="center"><a href="https://icyjoseph.dev/"><img src="https://avatars.githubusercontent.com/u/21013447?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Joseph</b></sub></a><br /><a href="https://github.com/cassiozen/useStateMachine/commits?author=icyJoseph" title="Code">💻</a></td>
    <td align="center"><a href="https://github.com/mutewinter"><img src="https://avatars.githubusercontent.com/u/305901?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Jeremy Mack</b></sub></a><br /><a href="https://github.com/cassiozen/useStateMachine/commits?author=mutewinter" title="Documentation">📖</a></td>
    
  </tr>
  <tr>
    <td align="center"><a href="https://github.com/devronhansen"><img src="https://avatars.githubusercontent.com/u/20226404?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Ron</b></sub></a><br /><a href="https://github.com/cassiozen/useStateMachine/commits?author=devronhansen" title="Documentation">📖</a></td>
    <td align="center"><a href="https://v01.io"><img src="https://avatars.githubusercontent.com/u/32771?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Klaus Breyer</b></sub></a><br /><a href="https://github.com/cassiozen/useStateMachine/commits?author=klausbreyer" title="Documentation">📖</a></td>
    <td align="center"><a href="https://linktr.ee/arthurdenner"><img src="https://avatars.githubusercontent.com/u/13774309?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Arthur Denner</b></sub></a><br /><a href="https://github.com/cassiozen/useStateMachine/commits?author=arthurdenner" title="Code">💻</a> <a href="https://github.com/cassiozen/useStateMachine/issues?q=author%3Aarthurdenner" title="Bug reports">🐛</a> <a href="https://github.com/cassiozen/useStateMachine/commits?author=arthurdenner" title="Tests">⚠️</a> <a href="#ideas-arthurdenner" title="Ideas, Planning, & Feedback">🤔</a></td>
  </tr>
</table>

<!-- markdownlint-restore -->
<!-- prettier-ignore-end -->

<!-- ALL-CONTRIBUTORS-LIST:END -->

This project follows the [all-contributors](https://github.com/all-contributors/all-contributors) specification. Contributions of any kind welcome!
