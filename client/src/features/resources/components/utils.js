import Ajv from "ajv";
import ajvErrors from "ajv-errors";

const dynamicPreannotationEntitySchema = (entityClasses) => {
  return {
    type: "array",
    uniqueItems: true, // Prevents duplicate items
    items: {
      type: "object",
      properties: {
        surface_form: {
          type: "string",
        },
        label: {
          type: "string",
          minLength: 1,
          enum: entityClasses || [],
          errorMessage: {
            enum:
              entityClasses.length > 10
                ? 'Label must match one in the entity ontology - ensure hierarchical labels use "/"'
                : `Label must be one of ${entityClasses.join(", ")}`,
          },
        },
      },
      required: ["surface_form", "label"],
      additionalProperties: false,
    },
  };
};

const ontologySchema = {
  type: "array",
  items: {
    type: "object",
    properties: {
      name: { type: "string", minLength: 1 },
      children: {
        type: "array",
        items: {
          type: "object",
          properties: {
            name: { type: "string" },
            children: {
              type: "array",
              items: { $ref: "#" }, // Recursive reference to the same schema
            },
            color: {
              type: "string",
              pattern: "^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$",
              default: "#800080",
            },
          },
          required: ["name", "children"],
        },
      },
      color: {
        type: "string",
        pattern: "^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$",
        default: "#800080",
      },
    },
    required: ["name", "children"],
  },
};

function createValidator(schema) {
  const ajv = new Ajv({ allErrors: true });
  ajvErrors(ajv);
  return ajv.compile(schema);
}

export function validateJSONData(
  classification,
  sub_classification,
  data,
  entityClasses = [],
  relationClasses = []
) {
  let validator;

  switch (classification) {
    case "ontology":
      validator = createValidator(ontologySchema);
      break;
    case "preannotation":
      if (sub_classification === "entity") {
        console.log(
          `creating preannotation validator with classes ${entityClasses}`
        );
        validator = createValidator(
          dynamicPreannotationEntitySchema(entityClasses)
        );
      } else if (sub_classification === "relation") {
      } else {
        throw new Error('Unexpected "sub_classiciation" value');
      }
      break;

    default:
      break;
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
    console.error(error);
    return input;
  }
}

// Validator for preannotation resources
export function validatePreannotation() {}

// CSV validation
export function validateCSV(csvString) {
  const errors = [];

  // Check if the CSV string is empty
  if (!csvString.trim()) {
    errors.push({ message: "the CSV file is empty." });
    return errors;
  }

  const rows = csvString.split("\n");

  // Check if the CSV has at least two rows (header + data)
  if (rows.length < 2) {
    errors.push({ message: "the CSV file should have at least two rows." });
    return errors;
  }

  const headers = rows[0].split(",");

  // Check if the CSV has exactly two columns
  if (headers.length !== 2) {
    errors.push({ message: "the CSV file should have exactly two columns." });
    return errors;
  }

  // Check if the first column header is "surface form"
  if (headers[0].trim() !== "surface form") {
    errors.push({
      message: 'the first column header should be "surface form".',
    });
  }

  // Check if the second column header is "classification"
  if (headers[1].trim() !== "classification") {
    errors.push({
      message: 'the second column header should be "classification".',
    });
  }

  // Check if all rows have exactly two columns
  for (let i = 1; i < rows.length; i++) {
    const rowColumns = rows[i].split(",");

    if (rowColumns.length !== 2) {
      errors.push({
        message: `row should have exactly two columns.`,
        instancePath: `Row ${i + 1}`,
      });
    }
  }

  // You can add more checks here, depending on the requirements of your application
  // For example, you can check if the values in the "classification" column have a specific format.

  return errors;
}
