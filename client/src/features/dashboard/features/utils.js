/**
 * This function takes in a dictionary object `data` where the keys represent usernames and the values are arrays of entities,
 * where each entity is represented as a dictionary with keys `ontology_item_id`, `start`, and `end`.
 *
 * The function returns an array of entities that are agreed-upon by a set of supplied usernames.
 * If only one username is supplied in the `usernames` array, it returns an array of entities corresponding to that username.
 * If more than one username is supplied in the `usernames` array, the function calculates the number of occurrences of each entity across all supplied usernames
 * and returns only those entities that have been agreed upon by the majority of the usernames.
 *
 * Duplicate entities are not included in the result array. If an entity in the input data has additional keys besides `ontology_item_id`, `start`, and `end`,
 * those keys are ignored.
 *
 * @param {Object} data - A dictionary object where the keys represent usernames and the values are arrays of entities.
 * @param {Array} usernames - A list of usernames to filter entities for.
 * @returns {Array} An array of entities that are agreed upon by the set of supplied usernames.
 */
export function filterEntityData(data, usernames = []) {
  if (usernames.length === 0) {
    usernames = Object.keys(data);
  }

  if (usernames.length === 1) {
    return (
      data[usernames[0]]?.map((e) => ({
        ontology_item_id: e.ontology_item_id,
        ontology_item_name: e.ontology_item_name,
        ontology_item_fullname: e.ontology_item_fullname,
        ontology_item_color: e.ontology_item_color,
        start: e.start,
        end: e.end,
        suggested: e.suggested,
      })) || []
    );
  }

  const entityCounts = {};
  const agreedUponEntityKeys = new Set();

  // Count the number of occurrences of each entity
  for (const username of usernames) {
    const entities = data[username] || [];
    for (const entity of entities) {
      const key = `${entity.ontology_item_id},${entity.start},${entity.end},${entity.suggested}`;
      entityCounts[key] = (entityCounts[key] || 0) + 1;
      if (entityCounts[key] > Math.ceil(usernames.length / 2)) {
        agreedUponEntityKeys.add(key);
      }
    }
  }

  const agreedUponEntities = [];

  // Add the agreed upon entities to the result array
  for (const username of usernames) {
    const entities = data[username] || [];
    for (const entity of entities) {
      const key = `${entity.ontology_item_id},${entity.start},${entity.end},${entity.suggested}`;
      if (agreedUponEntityKeys.has(key)) {
        const {
          ontology_item_id,
          ontology_item_name,
          ontology_item_fullname,
          ontology_item_color,
          start,
          end,
          suggested,
        } = entity;
        agreedUponEntities.push({
          ontology_item_id,
          ontology_item_name,
          ontology_item_fullname,
          ontology_item_color,
          start,
          end,
          suggested,
        });
        agreedUponEntityKeys.delete(key);
      }
    }
  }

  return agreedUponEntities;
}

export function filterRelationData(data, usernames = []) {
  console.log("filterRelationData", data, usernames);

  if (usernames.length === 0) {
    usernames = Object.keys(data);
  }

  if (usernames.length === 1) {
    return data[usernames[0]] || [];
  }

  const relationCounts = {};
  const agreedUponRelationKeys = new Set();

  // Count the number of occurrences of each entity
  for (const username of usernames) {
    const relations = data[username] || [];
    for (const relation of relations) {
      const key = `${relation.source.ontology_item_id}-${relation.source.surface_form}-${relation.ontology_item_id}-${relation.target.ontology_item_id}-${relation.target.surface_form}`;
      relationCounts[key] = (relationCounts[key] || 0) + 1;
      if (relationCounts[key] > Math.ceil(usernames.length / 2)) {
        agreedUponRelationKeys.add(key);
      }
    }
  }

  console.log("relation counts", relationCounts);

  const agreedUponRelations = [];

  // Add the agreed upon entities to the result array
  for (const username of usernames) {
    const relations = data[username] || [];
    for (const relation of relations) {
      const key = `${relation.source.ontology_item_id}-${relation.source.surface_form}-${relation.ontology_item_id}-${relation.target.ontology_item_id}-${relation.target.surface_form}`;
      if (agreedUponRelationKeys.has(key)) {
        agreedUponRelations.push(relation);
        agreedUponRelationKeys.delete(key);
      }
    }
  }

  return agreedUponRelations;
}
