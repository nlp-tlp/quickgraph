export const updateTexts = (
  action,
  texts,
  textTokenIds,
  focusTokenId,
  replacement
) => {
  /**
   * Performs operations on a set of texts comprised of token(s) such as apply, accept, or delete.
   * `textTokenIds` is {textId: [tokenId, ..., tokenId]}`
   */

  let updatedTexts = texts;

  Object.keys(textTokenIds).map((textId) => {
    const tokenIdsToUpdate = textTokenIds[textId];

    const text = texts[textId];
    const newTokens = Object.values(text.tokens).map((token) => {
      if (tokenIdsToUpdate.includes(token._id)) {
        switch (action) {
          case "apply":
            if (focusTokenId == token._id) {
              // Only token action was applied to is a replacement, rest are suggestions.
              return {
                ...token,
                replacement: replacement,
                currentValue: replacement,
              };
            } else {
              return {
                ...token,
                suggestion: replacement,
                currentValue: replacement,
              };
            }
          case "delete":
            return {
              ...token,
              replacement: null,
              suggestion: null,
              currentValue: token.value,
            };
          case "accept":
            return {
              ...token,
              replacement: token.suggestion,
              currentValue: token.suggestion,
            };
          default:
            throw new Error("Token operation/action not specified correctly");
        }
      } else {
        return token;
      }
    });

    updatedTexts = {
      ...updatedTexts,
      [textId]: { ...text, tokens: newTokens },
    };
  });

  return updatedTexts;
};
