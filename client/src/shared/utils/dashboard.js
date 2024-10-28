export const isEquivalent = (a, b) => {
  /**
   * Compares two objects to check if they are equivalent.
   * @param {object} a - The first object to be compared.
   * @param {object} b - The second object to be compared.
   * @returns {boolean} - Returns true if the objects are equivalent, false otherwise.
   */
  const aProps = Object.getOwnPropertyNames(a);

  for (const propName of aProps) {
    if (b.hasOwnProperty(propName)) {
      if (a[propName] !== b[propName]) {
        if (
          typeof a[propName] === "object" &&
          typeof b[propName] === "object"
        ) {
          if (!isEquivalent(a[propName], b[propName])) {
            return false;
          }
        } else {
          return false;
        }
      }
    } else {
      return false;
    }
  }

  return true;
};
