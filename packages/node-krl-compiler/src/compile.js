var _ = require('lodash');
var toId = require('to-js-identifier');
var mkTree = require('estree-builder');

var comp_by_type = {
  'String': function(ast, comp, e){
    return e('string', ast.value);
  },
  'Identifier': function(ast, comp, e){
    return e('id', toId(ast.value));
  },
  'Chevron': function(ast, comp, e){
    if(ast.value.length !== 1){
      throw new Error('TODO finish implementing Chevron compiler');
    }
    return comp(ast.value[0]);
  },
  'Boolean': function(ast, comp, e){
    return e(ast.value ? 'true' : 'false');
  },
  'RegExp': function(ast, comp, e){
    var flags = '';
    if(ast.value.global){
      flags += 'g';
    }
    if(ast.value.ignoreCase){
      flags += 'i';
    }
    return e('new', e('id', 'RegExp'), [
      e('str', ast.value.source),
      e('str', flags)
    ]);
  },
  'DomainIdentifier': function(ast, comp, e){
    //TODO the right way
    return e('id', toId(ast.value));
  },
  'Application': function(ast, comp, e){
    return e('call',
      comp(ast.callee),
      comp(ast.args)
    );
  },
  'InfixOperator': function(ast, comp, e){
    if(ast.op === '+'){
      return e('+', comp(ast.left), comp(ast.right));
    }
    throw new Error('Unsuported InfixOperator.op: ' + ast.op);
  },
  'Function': function(ast, comp, e){
    return e('function', _.map(ast.params, function(param){
      return param.value;
    }), _.map(ast.body, function(part, i){
      if(i < (ast.body.length - 1)){
        return comp(part);
      }
      return e('return', comp(part).expression, part.loc);
    }));
  },
  'Declaration': function(ast, comp, e){
    if(ast.op === '='){
      return e('var', comp(ast.left), comp(ast.right));
    }
    throw new Error('Unsuported Declaration.op: ' + ast.op);
  },
  'ExpressionStatement': function(ast, comp, e){
    return e(';', comp(ast.expression));
  },
  'Ruleset': function(ast, comp, e){
    var rules_obj = {};
    _.each(ast.rules, function(rule){
      rules_obj[rule.name.value] = comp(rule);
    });
    return comp(ast.global).concat([
      e(';', e('=', e('.', e('id', 'module'), e('id', 'exports')), e('obj', {
        name: comp(ast.name),
        meta: e('obj-raw', comp(ast.meta)),
        rules: e('obj', rules_obj)
      })))
    ]);
  },
  'RulesetName': function(ast, comp, e){
    return e('string', ast.value);
  },
  'RulesetMetaProperty': function(ast, comp, e){
    var key = ast.key.value;
    var val = e('nil');
    if(_.includes([
      'String', 'Boolean', 'Chevron'
    ], _.get(ast, 'value.type'))){
      val = comp(ast.value);
    }
    if(key === 'shares'){
      val = e('obj-raw', _.map(ast.value.ids, function(id){
        return e('obj-prop', e('str', id.value, id.loc), comp(id));
      }));
    }
    return e('obj-prop', e('str', key, ast.key.loc), val);
  },
  'Rule': function(ast, comp, e){
    var rule = {
      name: e('string', ast.name.value, ast.name.loc)
    };
    if(ast.rule_state !== 'active'){
      rule.rule_state = e('string', ast.rule_state);
    }
    if(ast.select){
      rule.select = comp(ast.select);
    }
    //TODO ast.prelude
    if(ast.action_block){
      rule.action_block = comp(ast.action_block);
    }
    if(ast.postlude){
      rule.postlude = comp(ast.postlude);
    }
    return e('obj', rule);
  },
  'RuleSelect': require('./c/RuleSelect'),
  'EventExpression': require('./c/EventExpression'),
  'RuleActionBlock': function(ast, comp, e){
    var block = {};
    //TODO "condition": COND,
    //TODO "block_type": "choose",
    block.actions = e('arr', _.map(ast.actions, function(action){
      return comp(action);
    }));
    return e('obj', block);
  },
  'RuleAction': function(ast, comp, e){
    var fn_body = [];
    fn_body.push(e(';', e('call', e('id', 'callback'), [
      e('nil'),
      e('obj', {
        type: e('str', 'directive'),
        name: e('str', ast.args[0].value),
        options: e('obj', _.fromPairs(_.map(ast['with'], function(dec){
          return [dec.left.value, comp(dec.right)];
        })))
      })
    ])));
    return e('fn', ['ctx', 'callback'], fn_body);
  },
  'RulePostlude': require('./c/RulePostlude'),
  'SetStatement': function(ast, comp, e){
    return e(';', e('=', comp(ast.left), comp(ast.right)));
  }
};

var isKRL_loc = function(loc){
  return _.isPlainObject(loc) && _.has(loc, 'start') && _.has(loc, 'end');
};

module.exports = function(ast, options){
  options = options || {};

  var toLoc = options.toLoc || _.noop;

  var mkE = function(default_krl_loc){
    var default_loc = toLoc(default_krl_loc.start, default_krl_loc.end);

    return function(){
      var args = Array.prototype.slice.call(arguments);
      var last_i = args.length - 1;
      var last = args[last_i];
      if(isKRL_loc(last)){
        args[last_i] = toLoc(last.start, last.end);
      }else{
        args.push(default_loc);
      }
      return mkTree.apply(null, args);
    };
  };

  var compile = function compile(ast){
    if(_.isArray(ast)){
      return _.map(ast, function(a){
        return compile(a);
      });
    }else if(!_.has(ast, 'type')){
      throw new Error('Invalid ast node: ' + JSON.stringify(ast));
    }else if(!_.has(comp_by_type, ast.type)){
      throw new Error('Unsupported ast node type: ' + ast.type);
    }
    return comp_by_type[ast.type](ast, compile, mkE(ast.loc));
  };

  return compile(ast, 0);
};
