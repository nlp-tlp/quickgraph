import Ajv from "ajv";
import ajvErrors from "ajv-errors";

const schema = {
  type: "array",
  items: {
    type: "object",
    properties: {
      original: { type: "string", minLength: 1 },
      tokens: { type: "array", items: { type: "string", minLength: 1 } },
      external_id: { type: "string", minLength: 1 },
      extra_fields: { type: "object" },
    },
    required: ["original", "tokens"],
    additionalProperties: false,
  },
};

// TODO: make start <= end enforced for tags on JSON schema
const dynamicEntitySchema = (entityClasses) => {
  return {
    type: "array",
    items: {
      type: "object",
      properties: {
        original: { type: "string", minLength: 1 },
        tokens: { type: "array", items: { type: "string", minLength: 1 } },
        entities: {
          type: "array",
          items: {
            type: "object",
            properties: {
              start: { type: "integer", minimum: 0 },
              end: { type: "integer", minimum: 0 },
              label: {
                type: "string",
                minLength: 1,
                enum: entityClasses || [],
                errorMessage: {
                  enum:
                    entityClasses.length > 10
                      ? 'Label must match one in the entity ontology - ensure hierarchical labels use "/" - current value ${/label}'
                      : `Label must be one of ${entityClasses.join(", ")}`,
                },
              },
            },
            required: ["start", "end", "label"],
            additionalProperties: false,
          },
        },
        external_id: { type: "string", minLength: 1 },
        extra_fields: { type: "object" },
      },
      required: ["original", "tokens", "entities"],
      additionalProperties: false,
    },
  };
};

const dynamicRelationSchema = (entityClasses, relationClasses) => {
  return {
    type: "array",
    items: {
      type: "object",
      properties: {
        original: { type: "string", minLength: 1 },
        tokens: { type: "array", items: { type: "string", minLength: 1 } },
        entities: {
          type: "array",
          items: {
            type: "object",
            properties: {
              start: { type: "integer", minimum: 0 },
              end: { type: "integer", minimum: 0 },
              id: { type: "string", minLength: 1 },
              label: {
                type: "string",
                minLength: 1,
                enum: entityClasses || [],
                errorMessage: {
                  enum:
                    entityClasses.length > 10
                      ? 'Label must match one in the entity ontology - ensure hierarchical labels use "/"'
                      : `must be one of ${entityClasses.join(", ")}`,
                },
              },
            },
            required: ["start", "end", "label", "id"],
            additionalProperties: false,
          },
        },
        relations: {
          type: "array",
          items: {
            type: "object",
            properties: {
              source_id: { type: "string", minLength: 1 },
              target_id: { type: "string", minLength: 1 },
              label: {
                type: "string",
                minLength: 1,
                enum: relationClasses || [],
                errorMessage: {
                  enum:
                    relationClasses.length > 10
                      ? 'Labels must match the relation ontology - ensure hierarchical labels use "/"'
                      : `must be one of ${relationClasses.join(", ")}`,
                },
              },
            },
            required: ["source_id", "target_id", "label"],
            additionalProperties: false,
          },
        },
        external_id: { type: "string", minLength: 1 },
        extra_fields: { type: "object" },
      },
      required: ["original", "tokens", "entities", "relations"],
      additionalProperties: false,
    },
  };
};

function createValidator(schema) {
  const ajv = new Ajv({ allErrors: true });
  ajvErrors(ajv);
  return ajv.compile(schema);
}

export function validateData({
  data,
  datasetType = 0,
  entityClasses = [],
  relationClasses = [],
}) {
  let validator;
  switch (datasetType) {
    case 0:
      validator = createValidator(schema);
      break;
    case 1:
      validator = createValidator(dynamicEntitySchema(entityClasses));
      break;
    case 2:
      validator = createValidator(
        dynamicRelationSchema(entityClasses, relationClasses)
      );
      break;
    default:
      throw new Error(`Invalid annotated dataset: ${datasetType}`);
  }

  if (data === "") {
    return [];
  }

  try {
    // Check if the data is already a valid JSON object
    if (typeof data !== "object") {
      // Attempt to parse the data as JSON
      data = JSON.parse(data);
    }
  } catch (err) {
    return [{ message: "Invalid JSON format" }];
  }

  const valid = validator(data);

  if (!valid) {
    return validator.errors;
  }
  return [];
}

export function prettifyJson(input) {
  try {
    const parsedInput = JSON.parse(input);
    return JSON.stringify(parsedInput, null, 2);
  } catch (error) {
    // console.error(error);
    return input;
  }
}

/**
 * Prints an error message, the data path of the error, and the line of data that caused the error.
 *
 * @param {string} dataType - The type of data being processed ("text" or "json").
 * @param {Object} error - The error object returned by AJV.
 * @param {Object} data - The data that was validated by AJV.
 */
export function printErrorLine(dataType, error, data) {
  if (error.instancePath) {
    if (dataType === "text") {
      return "";
    }
    if (dataType === "json") {
      try {
        const index = parseInt(error.instancePath.split("/")[1]);
        return JSON.stringify(JSON.parse(data)[index]);
      } catch (error) {
        return "Unable to parse input";
      }
    }
  }
}

// TEXT validation
export function validateNewlineSeparatedText(input) {
  let lines = [];
  if (Array.isArray(input)) {
    lines = input;
  } else if (typeof input === "string") {
    lines = input.split("\n");
  } else {
    return [];
  }

  const errors = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) {
      errors.push({
        message: "line must not be blank",
        instancePath: `line ${i + 1}`,
      });
    }
  }

  return errors.length ? errors : [];
}

// Data handler for JSON dataset create payloads

/**
 * Pushes all keys in each object of the input array that are not "original", "tokens", "entities", "relations", or "extra_id" into a new
 * key called "extra_fields" and removes them from the input object.
 *
 * @param {Array<object>} dataArray - The input array of objects to modify.
 * @returns {Array<object>} The modified array of objects with the "extra_fields" key and all extra fields removed.
 */
export function pushKeysToExtraFields(dataArray) {
  const outputArray = [];

  for (const data of dataArray) {
    const extraFields = {};

    for (const [key, value] of Object.entries(data)) {
      if (
        ![
          "original",
          "tokens",
          "entities",
          "relations",
          "external_id",
        ].includes(key) &&
        !(key in extraFields)
      ) {
        extraFields[key] = value;
        delete data[key];
      }
    }

    data.extra_fields = extraFields;
    outputArray.push(data);
  }

  return outputArray;
}
