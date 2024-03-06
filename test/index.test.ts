import "global-jsdom/register";

import { act, renderHook } from "@testing-library/react";
import { useMemo, useSyncExternalStore } from "react";
import {
  type UseStateMachine,
  createStateMachine,
  t,
  useExternalStateMachine,
  useStateMachine,
  useSyncedStateMachine,
} from "../src";

// @ts-expect-error
global.__DEV__ = true;

function useStateMachineImplementedByUseExternalStateMachine(def: any) {
  // biome-ignore lint/correctness/useExhaustiveDependencies: ignore
  const machine = useMemo(() => createStateMachine(def), []);
  return useExternalStateMachine(machine);
}

function useStateMachineImplementedByUseSyncedStateMachine(def: any) {
  const [getState, send] = useSyncedStateMachine(def);
  // biome-ignore lint/correctness/useExhaustiveDependencies: ignore
  const { subscribe, sendAndNotify } = useMemo(() => {
    const callbacks = new Set<any>();

    return {
      subscribe(callback: any) {
        callbacks.add(callback);

        return () => {
          callbacks.delete(callback);
        };
      },
      sendAndNotify(sendable: never) {
        send(sendable);

        for (const callback of callbacks) {
          callback();
        }
      },
    };
  }, []);
  const state = useSyncExternalStore(subscribe, getState, getState);

  return [state, sendAndNotify];
}

describe.each(
  [
    useStateMachine,
    useStateMachineImplementedByUseExternalStateMachine as UseStateMachine,
    useStateMachineImplementedByUseSyncedStateMachine as UseStateMachine,
  ].map((useHook) =>
    Object.assign(useHook, {
      toString() {
        return useHook.name || "<anonymous>";
      },
    }),
  ),
)("%s", (useHook) => {
  describe("States & Transitions", () => {
    it("should set initial state", () => {
      const { result } = renderHook(() =>
        useHook({
          initial: "inactive",
          states: {
            inactive: {
              on: { ACTIVATE: "active" },
            },
            active: {
              on: { DEACTIVATE: "inactive" },
            },
          },
        }),
      );

      expect(result.current[0]).toStrictEqual({
        context: undefined,
        event: { type: "$$initial" },
        value: "inactive",
        nextEvents: ["ACTIVATE"],
        nextEventsT: ["ACTIVATE"],
      });
    });

    it("should transition", () => {
      const { result } = renderHook(() =>
        useHook({
          initial: "inactive",
          states: {
            inactive: {
              on: { ACTIVATE: "active" },
            },
            active: {
              on: { DEACTIVATE: "inactive" },
            },
          },
        }),
      );

      act(() => {
        result.current[1]("ACTIVATE");
      });

      expect(result.current[0]).toStrictEqual({
        context: undefined,
        event: {
          type: "ACTIVATE",
        },
        value: "active",
        nextEvents: ["DEACTIVATE"],
        nextEventsT: ["DEACTIVATE"],
      });
    });

    it("should transition using a top-level `on`", () => {
      const { result } = renderHook(() =>
        useHook({
          initial: "inactive",
          states: {
            inactive: {
              on: { ACTIVATE: "active" },
            },
            active: {
              on: { DEACTIVATE: "inactive" },
            },
          },
          on: {
            FORCE_ACTIVATE: "active",
          },
        }),
      );

      act(() => {
        result.current[1]("FORCE_ACTIVATE");
      });

      expect(result.current[0]).toStrictEqual({
        context: undefined,
        event: {
          type: "FORCE_ACTIVATE",
        },
        value: "active",
        nextEvents: ["DEACTIVATE", "FORCE_ACTIVATE"],
        nextEventsT: ["DEACTIVATE", "FORCE_ACTIVATE"],
      });
    });

    it("should transition using an object event", () => {
      const { result } = renderHook(() =>
        useHook({
          initial: "inactive",
          states: {
            inactive: {
              on: { ACTIVATE: "active" },
            },
            active: {
              on: { DEACTIVATE: "inactive" },
            },
          },
        }),
      );

      act(() => {
        result.current[1]({ type: "ACTIVATE" });
      });

      expect(result.current[0]).toStrictEqual({
        context: undefined,
        event: {
          type: "ACTIVATE",
        },
        value: "active",
        nextEvents: ["DEACTIVATE"],
        nextEventsT: ["DEACTIVATE"],
      });
    });

    it("should ignore unexisting events", () => {
      const { result } = renderHook(() =>
        useHook({
          initial: "inactive",
          states: {
            inactive: {
              on: { TOGGLE: "active" },
            },
            active: {
              on: { TOGGLE: "inactive" },
            },
          },
        }),
      );

      act(() => {
        // TypeScript won"t allow me to type "ON" because it knows it"s not a valid event
        // @ts-expect-error
        result.current[1]("ON");
      });

      expect(result.current[0]).toStrictEqual({
        context: undefined,
        event: { type: "$$initial" },
        value: "inactive",
        nextEvents: ["TOGGLE"],
        nextEventsT: ["TOGGLE"],
      });
    });

    it("should transition with object syntax", () => {
      const { result } = renderHook(() =>
        useHook({
          initial: "inactive",
          states: {
            inactive: {
              on: {
                TOGGLE: {
                  target: "active",
                },
              },
            },
            active: {
              on: {
                TOGGLE: {
                  target: "inactive",
                },
              },
            },
          },
        }),
      );

      act(() => {
        result.current[1]("TOGGLE");
      });

      expect(result.current[0]).toStrictEqual({
        context: undefined,
        event: {
          type: "TOGGLE",
        },
        value: "active",
        nextEvents: ["TOGGLE"],
        nextEventsT: ["TOGGLE"],
      });
    });
    it("should invoke effect callbacks", () => {
      const entry = jest.fn();
      const exit = jest.fn();
      const { result } = renderHook(() =>
        useHook({
          initial: "inactive",
          states: {
            inactive: {
              on: { TOGGLE: "active" },
              effect() {
                entry("inactive");
                return exit.bind(null, "inactive");
              },
            },
            active: {
              on: { TOGGLE: "inactive" },
              effect() {
                entry("active");
                return exit.bind(null, "active");
              },
            },
          },
        }),
      );

      act(() => {
        result.current[1]("TOGGLE");
      });

      expect(entry.mock.calls.length).toBe(2);
      expect(exit.mock.calls.length).toBe(1);

      const [entry1, entry2] = entry.mock.invocationCallOrder;
      const [exit1] = exit.mock.invocationCallOrder;
      // entry1 < exit1 < entry2
      expect(entry1).toBeLessThan(entry2!);
      expect(exit1).toBeLessThan(entry2!);

      expect(entry.mock.calls[0][0]).toBe("inactive");
      expect(entry.mock.calls[1][0]).toBe("active");

      expect(exit.mock.calls[0][0]).toBe("inactive");
    });

    it("should transition from effect", () => {
      const { result } = renderHook(() =>
        useHook({
          initial: "inactive",
          states: {
            inactive: {
              on: { TOGGLE: "active" },
              effect({ send }) {
                send("TOGGLE");
              },
            },
            active: {
              on: { TOGGLE: "inactive" },
            },
          },
        }),
      );

      expect(result.current[0]).toStrictEqual({
        context: undefined,
        event: {
          type: "TOGGLE",
        },
        value: "active",
        nextEvents: ["TOGGLE"],
        nextEventsT: ["TOGGLE"],
      });
    });

    it("should get payload sent with event object", () => {
      const effect = jest.fn();
      const { result } = renderHook(() =>
        useHook({
          schema: {
            events: {
              ACTIVATE: t<{ number: number }>(),
            },
          },
          context: undefined,
          initial: "inactive",
          states: {
            inactive: {
              on: { ACTIVATE: "active" },
            },
            active: {
              on: { DEACTIVATE: "inactive" },
              effect,
            },
          },
        }),
      );

      act(() => {
        result.current[1]({ type: "ACTIVATE", number: 10 });
      });
      expect(effect.mock.calls[0][0]["event"]).toStrictEqual({
        type: "ACTIVATE",
        number: 10,
      });
    });
    it("should invoke effect with context as a parameter", () => {
      const finalEffect = jest.fn();
      const initialEffect = jest.fn(({ setContext }) => {
        setContext((context: boolean) => !context).send("TOGGLE");
      });

      renderHook(() =>
        useHook({
          context: false,
          initial: "inactive",
          states: {
            inactive: {
              on: { TOGGLE: "active" },
              effect: initialEffect,
            },
            active: {
              effect: finalEffect,
            },
          },
        }),
      );

      expect(initialEffect).toHaveBeenCalledTimes(1);
      expect(initialEffect.mock.calls[0]![0]["context"]).toBe(false);

      expect(finalEffect).toHaveBeenCalledTimes(1);
      expect(finalEffect.mock.calls[0][0]["context"]).toBe(true);
    });
  });
  describe("guarded transitions", () => {
    it("should block transitions with guard returning false", () => {
      const guard = jest.fn(() => false);

      const { result } = renderHook(() =>
        useHook({
          initial: "inactive",
          states: {
            inactive: {
              on: {
                TOGGLE: {
                  target: "active",
                  guard,
                },
              },
            },
            active: {
              on: { TOGGLE: "inactive" },
            },
          },
        }),
      );

      act(() => {
        result.current[1]("TOGGLE");
      });

      expect(guard).toHaveBeenCalled();
      expect(result.current[0]).toStrictEqual({
        context: undefined,
        event: { type: "$$initial" },
        value: "inactive",
        nextEvents: ["TOGGLE"],
        nextEventsT: ["TOGGLE"],
      });
    });

    it("should allow transitions with guard returning true", () => {
      const guard = jest.fn(() => true);

      const { result } = renderHook(() =>
        useHook({
          initial: "inactive",
          states: {
            inactive: {
              on: {
                TOGGLE: {
                  target: "active",
                  guard,
                },
              },
            },
            active: {
              on: { TOGGLE: "inactive" },
            },
          },
        }),
      );

      act(() => {
        result.current[1]("TOGGLE");
      });

      expect(guard).toHaveBeenCalled();
      expect(result.current[0]).toStrictEqual({
        context: undefined,
        event: {
          type: "TOGGLE",
        },
        value: "active",
        nextEvents: ["TOGGLE"],
        nextEventsT: ["TOGGLE"],
      });
    });
  });
  describe("Extended State", () => {
    it("should set initial context", () => {
      const { result } = renderHook(() =>
        useHook({
          context: { foo: "bar" },
          initial: "inactive",
          states: {
            inactive: {
              on: { TOGGLE: "active" },
            },
            active: {
              on: { TOGGLE: "inactive" },
            },
          },
        }),
      );

      expect(result.current[0]).toStrictEqual({
        value: "inactive",
        context: { foo: "bar" },
        event: { type: "$$initial" },
        nextEvents: ["TOGGLE"],
        nextEventsT: ["TOGGLE"],
      });
    });

    it("should get the context inside effects", () => {
      const { result } = renderHook(() =>
        useHook({
          context: { foo: "bar" },
          initial: "inactive",
          states: {
            inactive: {
              on: { TOGGLE: "active" },
              effect(params) {
                expect(params.context).toStrictEqual({
                  foo: "bar",
                });
                expect(params.event).toStrictEqual({
                  type: "$$initial",
                });
              },
            },
            active: {
              on: { TOGGLE: "inactive" },
            },
          },
        }),
      );

      expect(result.current[0]).toStrictEqual({
        value: "inactive",
        context: { foo: "bar" },
        event: { type: "$$initial" },
        nextEvents: ["TOGGLE"],
        nextEventsT: ["TOGGLE"],
      });
    });

    it("should update context on entry", () => {
      const { result } = renderHook(() =>
        useHook({
          context: { toggleCount: 0 },
          initial: "inactive",
          states: {
            inactive: {
              on: { TOGGLE: "active" },
            },
            active: {
              on: { TOGGLE: "inactive" },
              effect({ setContext }) {
                setContext((c) => ({ toggleCount: c.toggleCount + 1 }));
              },
            },
          },
        }),
      );

      act(() => {
        result.current[1]("TOGGLE");
      });

      expect(result.current[0]).toStrictEqual({
        value: "active",
        context: { toggleCount: 1 },
        event: {
          type: "TOGGLE",
        },
        nextEvents: ["TOGGLE"],
        nextEventsT: ["TOGGLE"],
      });
    });
    it("should update context on exit", () => {
      const { result } = renderHook(() =>
        useHook({
          context: { toggleCount: 0 },
          initial: "inactive",
          states: {
            inactive: {
              on: { TOGGLE: "active" },
              effect({ setContext }) {
                return () =>
                  setContext((c) => ({ toggleCount: c.toggleCount + 1 }));
              },
            },
            active: {
              on: { TOGGLE: "inactive" },
            },
          },
        }),
      );

      act(() => {
        result.current[1]("TOGGLE");
      });

      expect(result.current[0]).toStrictEqual({
        value: "active",
        context: { toggleCount: 1 },
        event: {
          type: "TOGGLE",
        },
        nextEvents: ["TOGGLE"],
        nextEventsT: ["TOGGLE"],
      });
    });
  });
  describe("Verbose Mode (Logger)", () => {
    const format = (...xs: any[]) =>
      xs.reduce(
        (a, x) => a + (typeof x === "string" ? x : JSON.stringify(x)),
        "",
      );
    const logSpy = jest.spyOn(console, "log").mockImplementation(() => {});

    afterEach(() => {
      logSpy.mockClear();
    });

    it("should log when invalid event is provided as string", () => {
      renderHook(() =>
        useHook({
          verbose: true,
          initial: "idle",
          states: {
            idle: {
              on: null,
              // @ts-expect-error
              effect: ({ send }) => send("invalid"),
            },
          },
        }),
      );

      expect(logSpy).toHaveBeenCalled();
      expect(format(logSpy.mock.calls.flat())).toMatch(/invalid/);
    });

    it("should log when invalid event is provided as object", () => {
      renderHook(() =>
        useHook({
          verbose: true,
          initial: "idle",
          states: {
            idle: {
              on: null,
              // @ts-expect-error
              effect: ({ send }) => send({ type: "invalid" }),
            },
          },
        }),
      );

      expect(logSpy).toHaveBeenCalled();
      expect(format(logSpy.mock.calls.flat())).toMatch(/invalid/);
    });
  });
  describe("React performance", () => {
    it("should provide a stable `send`", () => {
      const { result, rerender } = renderHook(() =>
        useHook({
          initial: "inactive",
          states: {
            inactive: {
              on: { TOGGLE: "active" },
            },
            active: {
              on: { TOGGLE: "inactive" },
            },
          },
        }),
      );

      if (result.current instanceof Error) {
        throw result.current;
      }

      const [, send1] = result.current;

      act(() => {
        rerender();
      });

      if (result.current instanceof Error) {
        throw result.current;
      }

      const [, send2] = result.current;

      expect(send1).toBe(send2);
    });
  });
});
