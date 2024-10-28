export function flattenOntology(a) {
  return a.reduce(function (
    flattened,
    { id, name, fullname, domain, range, children, active }
  ) {
    return flattened
      .concat([{ id, name, fullname, domain, range, active }])
      .concat(children ? flattenOntology(children) : []);
  },
  []);
}

export const getFlatOntology = (a) => {
  return flattenOntology(a);
  function flattenOntology(a) {
    return a.reduce(function (
      flattened,
      { id, name, fullname, color = null, children, domain, range, active }
    ) {
      return flattened
        .concat([
          {
            id,
            name,
            fullname,
            color,
            domain,
            range,
            active,
            children,
          }, // Adds children back in for use elsewhere
        ])
        .concat(children ? flattenOntology(children) : []);
    },
    []);
  }
};

export const getCorpusLength = (corpus) => {
  if (Array.isArray(corpus)) {
    return corpus.length;
  } else {
    return Object.keys(JSON.parse(corpus)).length;
  }
};

export function generateRandomName() {
  const adjectives = [
    "happy",
    "silly",
    "jolly",
    "funky",
    "brave",
    "crazy",
    "fancy",
    "sunny",
  ];
  const nouns = [
    "penguin",
    "banana",
    "donut",
    "robot",
    "taco",
    "giraffe",
    "cactus",
    "unicorn",
  ];
  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  return `${adjective}-${noun}-party`;
}

/**
 * Returns the plural form of the given text based on the given count.
 *
 * @param {string} text - The singular form of the text to be pluralized.
 * @param {number} count - The count of the items.
 * @returns {string} The plural form of the text based on the count.
 */
export function pluralize(text, count) {
  if (count === 1) {
    return text;
  } else if (text.endsWith("y")) {
    // assume the plural form of text ending with a "y" is the text with "ies" at the end
    return text.slice(0, -1) + "ies";
  } else if (
    text.endsWith("s") ||
    text.endsWith("x") ||
    text.endsWith("z") ||
    text.endsWith("ch") ||
    text.endsWith("sh")
  ) {
    // assume the plural form of text ending with "s", "x", "z", "ch", or "sh" is the text with "es" at the end
    return text + "es";
  } else {
    // assume the plural form of all other text is the text with "s" at the end
    return text + "s";
  }
}
