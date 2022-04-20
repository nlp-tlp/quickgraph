export function flattenOntology(a) {
  return a.reduce(function (
    flattened,
    { _id, name, fullName, domain, range, children, isEntity }
  ) {
    return flattened
      .concat([{ _id, name, fullName, domain, range, isEntity }])
      .concat(children ? flattenOntology(children) : []);
  },
  []);
}
