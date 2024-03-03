import { act, renderHook } from "@testing-library/react-hooks";
import _useStateMachine, { t, Console } from "../src";

let log = "";
const logger: Console["log"] = (...xs) => {
  log += xs.reduce(
    (a, x) => a + (typeof x === "string" ? x : JSON.stringify(x)),
    "",
  );
};
const clearLog = () => {
  log = "";
};

const useStateMachine = ((d: any) =>
  _useStateMachine({
    ...d,
    console: { log: logger },
  })) as typeof _useStateMachine;

describe("useStateMachine", () => {
  describe("States & Transitions", () => {
    it("should set initial state", () => {
      const { result } = renderHook(() =>
        useStateMachine({
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
        useStateMachine({
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
        useStateMachine({
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
        useStateMachine({
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
        useStateMachine({
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
        useStateMachine({
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
        useStateMachine({
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

      expect(entry.mock.invocationCallOrder).toEqual([1, 3]);
      expect(exit.mock.invocationCallOrder).toEqual([2]);

      expect(entry.mock.calls[0][0]).toBe("inactive");
      expect(entry.mock.calls[1][0]).toBe("active");

      expect(exit.mock.calls[0][0]).toBe("inactive");
    });

    it("should transition from effect", () => {
      const { result } = renderHook(() =>
        useStateMachine({
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
        useStateMachine({
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
        useStateMachine({
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
        useStateMachine({
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
        useStateMachine({
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
        useStateMachine({
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
        useStateMachine({
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
        useStateMachine({
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
        useStateMachine({
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
    it("should log when invalid event is provided as string", () => {
      clearLog();
      renderHook(() =>
        useStateMachine({
          verbose: true,
          initial: "idle",
          states: {
            idle: {
              on: null,
              effect: ({ send }) =>
                // @ts-expect-error
                send("invalid"),
            },
          },
        }),
      );

      expect(log).toMatch(/invalid/);
    });

    it("should log when invalid event is provided as object", () => {
      clearLog();
      renderHook(() =>
        useStateMachine({
          verbose: true,
          initial: "idle",
          states: {
            idle: {
              on: null,
              effect: ({ send }) =>
                // @ts-expect-error
                send({ type: "invalid" }),
            },
          },
        }),
      );

      expect(log).toMatch(/invalid/);
    });
  });
  describe("React performance", () => {
    it("should provide a stable `send`", () => {
      const { result, rerender } = renderHook(() =>
        useStateMachine({
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
        rerender();
      });

      if (result.all[0] instanceof Error) {
        throw result.all[0];
      }

      if (result.all[1] instanceof Error) {
        throw result.all[1];
      }

      expect(result.all[0]![1]).toBe(result.all[1]![1]);
    });
  });
});
