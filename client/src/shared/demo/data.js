import { v4 as uuidv4 } from "uuid";

const defaultTextIds = ["text1", "text2", "text3"];

const defaultTexts = [
  "Fedex purchases 12 million electric vehicles",
  "Microsoft CEO Satya Nadella unvails windows 11",
  "Microsoft planned to supply Fedex with Azure cloud services",
];

const defaultOntology = [
  {
    id: "e1",
    name: "Person",
    fullName: "Person",
    color: "#4CAF50",
    domain: [],
    range: [],
    isEntity: true,
    active: true,
  },
  {
    id: "e2",
    name: "Organisation",
    fullName: "Organisation",
    color: "#ff9800",
    domain: [],
    range: [],
    isEntity: true,
    active: true,
  },
  {
    id: "e3",
    name: "Location",
    fullName: "Location",
    color: "#2196f3",
    domain: [],
    range: [],
    isEntity: true,
    active: true,
  },
  {
    id: "e4",
    name: "Miscellaneous",
    fullName: "Miscellaneous",
    color: "#9c27b0",
    domain: [],
    range: [],
    isEntity: true,
    active: true,
  },
  {
    id: "r1",
    name: "hasLocation",
    fullName: "hasLocation",
    domain: [],
    range: [],
    isEntity: false,
    active: true,
  },
  {
    id: "r2",
    name: "worksAt",
    fullName: "worksAt",
    domain: [],
    range: [],
    isEntity: false,
    active: true,
  },
];

const defaultEntities = {
  text1: [],
  text2: [
    {
      _id: "3c2c6e66-074d-429d-8dee-511661710ed7",
      textId: "text2",
      isEntity: true,
      createdBy: "demo",
      start: 2,
      end: 3,
      labelId: "e1",
      suggested: false,
      name: "Person",
      fullName: "Person",
      color: "#4CAF50",
    },
    {
      _id: "ade2735f-aa93-4d6e-a0bd-474df60241ff",
      textId: "text2",
      isEntity: true,
      createdBy: "demo",
      start: 0,
      end: 0,
      labelId: "e2",
      suggested: false,
      name: "Organisation",
      fullName: "Organisation",
      color: "#ff9800",
    },
    {
      _id: "eb8eec4c-f955-435d-9b45-c1aebf199045",
      textId: "text2",
      isEntity: true,
      createdBy: "demo",
      start: 5,
      end: 6,
      labelId: "e4",
      suggested: false,
      name: "Miscellaneous",
      fullName: "Miscellaneous",
      color: "#9c27b0",
    },
  ],
  text3: [
    {
      _id: "6a452b50-1239-4028-8a03-68fec3f18947",
      textId: "text3",
      isEntity: true,
      createdBy: "demo",
      start: 0,
      end: 0,
      labelId: "e2",
      suggested: false,
      name: "Organisation",
      fullName: "Organisation",
      color: "#ff9800",
    },
    {
      _id: "2b88b24c-396c-4aba-8b3c-6d651ee9813b",
      textId: "text3",
      isEntity: true,
      createdBy: "demo",
      start: 4,
      end: 4,
      labelId: "e2",
      suggested: false,
      name: "Organisation",
      fullName: "Organisation",
      color: "#ff9800",
    },
  ],
};

const defaultRelations = {
  text1: [],
  text2: [
    {
      _id: "0f36a849-03bf-493f-9747-2b9793999627",
      textId: "text2",
      isEntity: false,
      createdBy: "demo",
      source: "3c2c6e66-074d-429d-8dee-511661710ed7",
      target: "ade2735f-aa93-4d6e-a0bd-474df60241ff",
      labelId: "r2",
      name: "worksAt",
      fullName: "worksAt",
    },
  ],
  text3: [],
};

export const defaultGraphData = {
  nodes: [
    {
      label: "Microsoft",
      class: "Organisation",
      color: {
        border: "black",
        background: "#ff9800",
      },
      font: {
        color: "black",
      },
      id: 0,
      value: 1,
      title: "",
    },
    {
      label: "Satya Nadella",
      class: "Person",
      color: {
        border: "black",
        background: "#4CAF50",
      },
      font: {
        color: "black",
      },
      id: 1,
      value: 1,
      title: "",
    },
    {
      label: "windows 11",
      class: "Miscellaneous",
      color: {
        border: "black",
        background: "#9c27b0",
      },
      font: {
        color: "black",
      },
      id: 2,
      value: 1,
      title: "",
    },
    {
      label: "Microsoft",
      class: "Organisation",
      color: {
        border: "black",
        background: "#ff9800",
      },
      font: {
        color: "black",
      },
      title: "",
      value: 1,
      id: 3,
    },
    {
      label: "Fedex",
      color: {
        border: "black",
        background: "#ff9800",
      },
      font: {
        color: "black",
      },
      id: 4,
      value: 1,
      title: "",
    },
  ],
  links: [
    {
      id: 0,
      source: 1,
      target: 0,
      label: "worksAt",
      value: 1,
      title: "Frequency: 1",
    },
  ],
  relationships: {
    0: { nodes: [1], links: [0] },
    1: { nodes: [0], links: [0] },
    2: { nodes: [], links: [] },
    3: { nodes: [], links: [] },
    4: { nodes: [], links: [] },
  },
};

const createTextObject = (texts) => {
  const textObjs = Object.assign(
    {},
    ...texts.map((text, index) => {
      // const textId = uuidv4();
      const textId = defaultTextIds[index];
      return {
        [textId]: {
          _id: textId,
          saved: false,
          externalId: null,
          tokens: Object.assign(
            {},
            ...text.split(" ").map((token, tokenIdx) => {
              const tokenId = uuidv4();
              return {
                [tokenId]: {
                  _id: tokenId,
                  index: tokenIdx,
                  value: token,
                  textId: textId,
                  state: null,
                },
              };
            })
          ),
        },
      };
    })
  );

  return {
    tasks: { relationAnnotation: true, entityAnnotation: true },
    texts: textObjs,
    ontology: defaultOntology,
    relations: defaultRelations,
    // Object.assign(
    //   {},
    //   ...Object.keys(textObjs).map((textId) => ({ [textId]: [] }))
    // ),
    entities: defaultEntities,
    // Object.assign(
    //   {},
    //   ...Object.keys(textObjs).map((textId) => ({ [textId]: [] }))
    // ),
    totalDocs: texts.length,
    totalPages: 1,
  };
};

export const texts = createTextObject(defaultTexts);
