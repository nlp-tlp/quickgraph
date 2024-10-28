---
sidebar_position: 7
---
# Frequently Asked Questions (FAQ)

## How do I add an ontology to the presets?

Currently, QuickGraph does not have facilities to save custom ontologies or load ontologies from the user-interface. Instead, you can go to the `ontologies.js` file in the client directory `client/src/features/projectcreation/data`. Here, entity ontologies can be created by extending the `entityOntologies` object. The structure of the entity ontologies object is:

```
    "<entity_ontology_name>": [
        {
            name:"<class_name>",
            fullName: "<full_class_name>",
            description: "<description_of_class>",  // Optional; leave as empty string if not used. Will be used in the future.
            children: [
                {
                    name:"<class_name>",
                    fullName: "<parent_class_name>/<class_name>",
                    description: "<description_of_class>",
                    children: [...],
                    colour: "<class_colour>",   // Use same hex value or muiColorPalettee[n] to have same colour as parent,
                    _id: uuidv4(),
                    isEntity: true
                }
            ],
            colour: "<class_colour>"    // hex value e.g. "#E91E63" or getRandomColor() or muiColorPalettee500[n],
            _id: uuidv4(),
            isEntity: true
        }
    ]
```

Similarly, additional relation ontologies can be created by extending the `relationOntology` object. The structure of the relation ontologies object is:

```
    "<relation_ontology_name>": [
        {
            name:"<class_name>",
            fullName: "<full_class_name>",
            description: "<description_of_class>",  // Optional; leave as empty string if not used. Will be used in the future.
            domain: ["<entity_class_name>"],
            range: ["<entity_class_name>"],
            children: [
                {
                    name:"<class_name>",
                    fullName: "<parent_class_name>/<class_name>",
                    description: "<description_of_class>",
                    domain: ["<entity_class_name>"],
                    range: ["<entity_class_name>"],
                    children: [...],
                    _id: uuidv4(),
                    isEntity: false
                }
            ],
            _id: uuidv4(),
            isEntity: false
        }
    ]
```

## How do I apply constraints to my relations in my relation ontology?

Relation constraints are applied by supplying an array of entity class names in the `domain` and `range` keys. If no constraints are necessary for a relation, the value of 'all' must be supplied, for example: `domain: ['all'], range: ['all']`. The entity class names must be used in relation constraints, rather than their full names. Two toy ontologies are shown below, the entity ontology consists of 4 total classes with one having a depth of 2.

```
    "custom entities": [
        {
            name:"person",
            fullName: "person",
            description: "",
            children: [
                {
                    name:"president",
                    fullName: "person/president",
                    description: "",
                    children: [],
                    colour: "#4287f5",
                    _id: uuidv4(),
                    isEntity: true
                }
            ],
            colour: "#4287f5",
            _id: uuidv4(),
            isEntity: true
        },
        {
            name:"location",
            fullName: "location",
            description: "",
            children: [],
            colour: "#f5b042",
            _id: uuidv4(),
            isEntity: true
        },
        {
            name:"profession",
            fullName: "profession",
            description: "",
            children: [],
            colour: "#ff00c8",
            _id: uuidv4(),
            isEntity: true
        }
    ]
```

```
    "custom relations": [
        {
            name:"hasProfession",
            fullName: "hasProfession",
            description: "",
            domain: ["person"],
            range: ["profession"],
            children: [
                {
                    name:"hasGovernmentProfession",
                    fullName: "hasProfession/hasGovernmentProfession",
                    description: "",
                    domain: ["person"],
                    range: ["profession"],
                    children: [],
                    _id: uuidv4(),
                    isEntity: false
                }
            ],
            _id: uuidv4(),
            isEntity: false
        },
        {
            name:"hasLocation",
            fullName: "hasLocation",
            description: "",
            domain: ["person"],
            range: ["location"],
            children: [],
            _id: uuidv4(),
            isEntity: false
        },
    ]
```
