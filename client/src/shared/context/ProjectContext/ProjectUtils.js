export const generateTempId = () => {
  const prefix = "temp-";
  const uniqueId =
    Date.now().toString(36) + "-" + Math.random().toString(36).substr(2, 9);
  return prefix + uniqueId;
};

export const createHistoryObject = (action, payload) => ({
  action: action,
  ...payload,
  created_at: new Date().toUTCString(),
});

/**
 * Finds matches in the provided data based on the searchStrings and filters out matches with existing entities.
 *
 * @param {Object} data - The data object containing tokens.
 * @param {Array} searchStrings - An array of strings to search for in the tokens.
 * @param {Object} entities - An object containing existing entities with start and end token indexes.
 * @param {string} ontologyItemId - The ontology item ID used to filter out matches with existing entities.
 * @returns {Object} An object containing matches, where keys are data object IDs and values are arrays of matched start and end token indexes.
 */
export const findMatches = (data, searchStrings, entities, ontologyItemId) => {
  const result = {};

  Object.keys(data).forEach((id) => {
    const { tokens } = data[id];
    let searchStringMatchCounts = {};

    tokens.forEach((token, index) => {
      if (searchStrings.includes(token.value)) {
        searchStringMatchCounts[token.value] =
          searchStringMatchCounts[token.value] || [];
        searchStringMatchCounts[token.value].push({
          start_token_index: index,
          end_token_index: index,
        });
      }
    });

    // Check if all search strings have matches
    if (
      searchStrings.every((searchString) =>
        searchStringMatchCounts.hasOwnProperty(searchString)
      )
    ) {
      let tempResult = [];
      searchStrings.reduce((acc, searchString) => {
        const currMatches = searchStringMatchCounts[searchString];
        currMatches.forEach((match) => {
          if (acc.length === 0) {
            tempResult.push(match);
          } else {
            tempResult = tempResult.map((res) => {
              if (res.end_token_index < match.start_token_index) {
                return {
                  start_token_index: res.start_token_index,
                  end_token_index: match.end_token_index,
                };
              }
              return res;
            });
          }
        });
        return currMatches;
      }, []);

      if (entities[id]) {
        tempResult = tempResult.filter((match) => {
          return !entities[id].some((entity) => {
            return (
              entity.start === match.start_token_index &&
              entity.end === match.end_token_index &&
              entity.ontology_item_id === ontologyItemId
            );
          });
        });
      }

      if (tempResult.length > 0) {
        result[id] = tempResult;
      }
    }
  });

  return result;
};
