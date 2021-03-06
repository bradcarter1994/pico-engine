module.exports = function (ast, comp, e) {
  var args = {
    domain: e('string', ast.event_domain.value, ast.event_domain.loc),
    type: comp(ast.event_type),
    attributes: ast.event_attrs ? comp(ast.event_attrs) : e('nil'),

    for_rid: ast.for_rid ? comp(ast.for_rid) : e('nil')
  }

  return e(';', e('acall', e('id', 'ctx.raiseEvent'), [e('obj', args)]))
}
