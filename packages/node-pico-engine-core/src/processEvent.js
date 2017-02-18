var _ = require("lodash");
var Future = require("fibers/future");
var applyInFiber = require("./applyInFiber");
var selectRulesToEvalFuture = Future.wrap(require("./selectRulesToEval"));
var noopTrue = function(){
    return true;
};

var evalRuleInFiber = function(ctx, rule){
    if(_.isFunction(rule.prelude)){
        rule.prelude(ctx);
    }
    var did_fire = true;

    var cond = _.get(rule, ["action_block", "condition"], noopTrue)(ctx);
    var actions = _.get(rule, ["action_block", "actions"], []);
    var block_type = _.get(rule, ["action_block", "block_type"], "every");
    if(block_type === "choose"){
        actions = _.filter(actions, function(action){
            return action.label === cond;
        });
        if(_.isEmpty(actions)){
            did_fire = false;//not fired b/c nothing matched
        }
    }else if(!cond){
        did_fire = false;//not fired b/c falsey cond
    }

    if(!did_fire){
        actions = [];//don't run anything
    }

    //TODO handle more than one response type
    var responses = _.compact(_.map(actions, function(action){
        //TODO collect errors and respond individually to the client
        //TODO try{}catch(e){}
        var response = action.action(ctx);
        if((response === void 0) || (response === null)){
            return;//noop
        }
        if(response.type !== "directive"){
            return response;
        }
        return {
            type: "directive",
            options: response.options,
            name: response.name,
            meta: {
                rid: rule.rid,
                rule_name: rule.name,
                txn_id: "TODO",//TODO transactions
                eid: ctx.event.eid
            }
        };
    }));

    var getPostFn = function(name){
        var fn = _.get(rule, ["postlude", name]);
        return _.isFunction(fn) ? fn : _.noop;
    };
    if(did_fire){
        ctx.emit("debug", "fired");
        getPostFn("fired")(ctx);
    }else{
        ctx.emit("debug", "not fired");
        getPostFn("notfired")(ctx);
    }
    getPostFn("always")(ctx);

    return responses;
};

var runEvent = function(scheduled){
    var rule = scheduled.rule;
    var ctx = scheduled.ctx;

    ctx.emit("debug", "rule selected: " + rule.rid + " -> " + rule.name);

    ctx.rid = rule.rid;
    ctx.rule = rule;
    ctx.scope = rule.scope;
    if(_.has(ctx.rulesets, rule.rid)){
        ctx.modules_used = ctx.rulesets[rule.rid].modules_used;
    }

    var r = [];
    if(rule.foreach){
        rule.foreach(ctx, function(val, iter){
            var counter = _.size(val);
            return _.mapValues(val, function(){
                var args = _.toArray(arguments);
                counter--;
                return iter(_.assign({}, ctx, {
                    foreach_is_final: counter === 0
                }), args);
            });
        }, function(ctx){
            r.push(evalRuleInFiber(ctx, rule));
        });
    }else{
        r.push(evalRuleInFiber(ctx, rule));
    }
    return r;
};

var processEvent = function(ctx, mkCTX){
    ctx.emit("debug", "event being processed");

    var schedule = [];
    var scheduleEvent = function(ctx){
        var rules = selectRulesToEvalFuture(ctx).wait();
        _.each(rules, function(rule){
            ctx.emit("debug", "rule added to schedule: " + rule.rid + " -> " + rule.name);
            schedule.push({rule: rule, ctx: ctx});
        });
    };

    scheduleEvent(ctx);

    ctx.raiseEvent = function(revent){
        //shape the revent like a normal event
        var event = {
            eci: ctx.event.eci,//raise event is always to the same pico
            eid: ctx.event.eid,//inherit from parent event to aid in debugging
            domain: revent.domain,
            type: revent.type,
            attrs: revent.attributes,
            for_rid: revent.for_rid,
            timestamp: new Date()
        };
        //must make a new ctx for this raise b/c it's a different event
        var raise_ctx = mkCTX({
            event: event,
            pico_id: ctx.pico_id//raise event is always to the same pico
        });
        raise_ctx.raiseEvent = ctx.raiseEvent;
        raise_ctx.emit("debug", "adding raised event to schedule: " + revent.domain + "/" + revent.type);
        scheduleEvent(raise_ctx);
    };


    var responses = [];
    //using a while loop b/c schedule is MUTABLE
    //Durring execution new events may be `raised` that will mutate the schedule
    while(schedule.length > 0){
        responses.push(runEvent(schedule.shift()));
    }

    var res_by_type = _.groupBy(_.flattenDeep(_.values(responses)), "type");

    var r = _.mapValues(res_by_type, function(responses, key){
        if(key === "directive"){
            return _.map(responses, function(d){
                return _.omit(d, "type");
            });
        }
        return responses;
    });

    if(_.has(r, "directive")){
        r.directives = r.directive;
        delete r.directive;
    }else{
        //we always want to return a directives array even if it's empty
        r.directives = [];
    }

    ctx.emit("debug", "event finished processing");
    ctx.emit("episode_stop");

    return r;
};

module.exports = function(ctx, mkCTX, callback){
    applyInFiber(processEvent, void 0, [ctx, mkCTX], callback);
};