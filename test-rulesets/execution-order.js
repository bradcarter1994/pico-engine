module.exports = {
  "rid": "io.picolabs.execution-order",
  "meta": { "shares": ["getOrder"] },
  "global": function* (ctx) {
    ctx.scope.set("getOrder", ctx.mkFunction([], function* (ctx, args) {
      return yield ctx.modules.get(ctx, "ent", "order", undefined);
    }));
  },
  "rules": {
    "first": {
      "name": "first",
      "select": {
        "graph": { "execution_order": { "all": { "expr_0": true } } },
        "eventexprs": {
          "expr_0": function* (ctx, aggregateEvent) {
            return true;
          }
        },
        "state_machine": {
          "start": [[
              "expr_0",
              "end"
            ]]
        }
      },
      "body": function* (ctx, runAction, toPairs) {
        var fired = true;
        if (fired) {
          yield runAction(ctx, void 0, "send_directive", ["first"], []);
        }
        if (fired)
          ctx.emit("debug", "fired");
        else
          ctx.emit("debug", "not fired");
        if (fired) {
          yield ctx.modules.set(ctx, "ent", "order", undefined, yield ctx.callKRLstdlib("append", [
            yield ctx.modules.get(ctx, "ent", "order", undefined),
            "first-fired"
          ]));
        }
        yield ctx.modules.set(ctx, "ent", "order", undefined, yield ctx.callKRLstdlib("append", [
          yield ctx.modules.get(ctx, "ent", "order", undefined),
          "first-finally"
        ]));
      }
    },
    "second": {
      "name": "second",
      "select": {
        "graph": { "execution_order": { "all": { "expr_0": true } } },
        "eventexprs": {
          "expr_0": function* (ctx, aggregateEvent) {
            return true;
          }
        },
        "state_machine": {
          "start": [[
              "expr_0",
              "end"
            ]]
        }
      },
      "body": function* (ctx, runAction, toPairs) {
        var fired = true;
        if (fired) {
          yield runAction(ctx, void 0, "send_directive", ["second"], []);
        }
        if (fired)
          ctx.emit("debug", "fired");
        else
          ctx.emit("debug", "not fired");
        if (fired) {
          yield ctx.modules.set(ctx, "ent", "order", undefined, yield ctx.callKRLstdlib("append", [
            yield ctx.modules.get(ctx, "ent", "order", undefined),
            "second-fired"
          ]));
        }
        yield ctx.modules.set(ctx, "ent", "order", undefined, yield ctx.callKRLstdlib("append", [
          yield ctx.modules.get(ctx, "ent", "order", undefined),
          "second-finally"
        ]));
      }
    },
    "reset_order": {
      "name": "reset_order",
      "select": {
        "graph": { "execution_order": { "reset_order": { "expr_0": true } } },
        "eventexprs": {
          "expr_0": function* (ctx, aggregateEvent) {
            return true;
          }
        },
        "state_machine": {
          "start": [[
              "expr_0",
              "end"
            ]]
        }
      },
      "body": function* (ctx, runAction, toPairs) {
        var fired = true;
        if (fired) {
          yield runAction(ctx, void 0, "send_directive", ["reset_order"], []);
        }
        if (fired)
          ctx.emit("debug", "fired");
        else
          ctx.emit("debug", "not fired");
        yield ctx.modules.set(ctx, "ent", "order", undefined, []);
      }
    },
    "foo_or_bar": {
      "name": "foo_or_bar",
      "select": {
        "graph": {
          "execution_order": {
            "foo": { "expr_0": true },
            "bar": { "expr_1": true }
          }
        },
        "eventexprs": {
          "expr_0": function* (ctx, aggregateEvent) {
            return true;
          },
          "expr_1": function* (ctx, aggregateEvent) {
            return true;
          }
        },
        "state_machine": {
          "start": [
            [
              "expr_0",
              "end"
            ],
            [
              "expr_1",
              "end"
            ]
          ]
        }
      },
      "body": function* (ctx, runAction, toPairs) {
        var fired = true;
        if (fired) {
          yield runAction(ctx, void 0, "send_directive", ["foo_or_bar"], []);
        }
        if (fired)
          ctx.emit("debug", "fired");
        else
          ctx.emit("debug", "not fired");
        yield ctx.modules.set(ctx, "ent", "order", undefined, yield ctx.callKRLstdlib("append", [
          yield ctx.modules.get(ctx, "ent", "order", undefined),
          "foo_or_bar"
        ]));
      }
    },
    "foo": {
      "name": "foo",
      "select": {
        "graph": { "execution_order": { "foo": { "expr_0": true } } },
        "eventexprs": {
          "expr_0": function* (ctx, aggregateEvent) {
            return true;
          }
        },
        "state_machine": {
          "start": [[
              "expr_0",
              "end"
            ]]
        }
      },
      "body": function* (ctx, runAction, toPairs) {
        var fired = true;
        if (fired) {
          yield runAction(ctx, void 0, "send_directive", ["foo"], []);
        }
        if (fired)
          ctx.emit("debug", "fired");
        else
          ctx.emit("debug", "not fired");
        yield ctx.modules.set(ctx, "ent", "order", undefined, yield ctx.callKRLstdlib("append", [
          yield ctx.modules.get(ctx, "ent", "order", undefined),
          "foo"
        ]));
      }
    },
    "bar": {
      "name": "bar",
      "select": {
        "graph": { "execution_order": { "bar": { "expr_0": true } } },
        "eventexprs": {
          "expr_0": function* (ctx, aggregateEvent) {
            return true;
          }
        },
        "state_machine": {
          "start": [[
              "expr_0",
              "end"
            ]]
        }
      },
      "body": function* (ctx, runAction, toPairs) {
        var fired = true;
        if (fired) {
          yield runAction(ctx, void 0, "send_directive", ["bar"], []);
        }
        if (fired)
          ctx.emit("debug", "fired");
        else
          ctx.emit("debug", "not fired");
        yield ctx.modules.set(ctx, "ent", "order", undefined, yield ctx.callKRLstdlib("append", [
          yield ctx.modules.get(ctx, "ent", "order", undefined),
          "bar"
        ]));
      }
    }
  }
};