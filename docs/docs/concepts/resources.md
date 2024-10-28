---
sidebar_position: 1
---

# Resources

This section provides an overview of the various resource types offered by QuickGraph. These resources are designed as flexible and reusable components that can be utilized across multiple projects. When a resource is initially created, it serves as a "blueprint" that can be dynamically updated using CRUD-like operations. Upon being assigned to a specific project, the "blueprint" resource is copied into a "project" resource, tailored for that particular project's needs.

<!-- They also enable advanced functionalities within QuickGraph, such as pre-annotation. -->

## Ontologies

Ontologies define the structure and relationships between entities and relations in a knowledge graph. They provide a standardized way to represent information and enable consistency across projects.

### Entity Ontology

The entity ontology encompasses all potential entities within the knowledge graph, usually grounded in lexical semantics. QuickGraph's entity ontologies can consist of numerous items arranged at any arbitrary hierarchical depth. This flexibility facilitates the annotation of texts using expansive ontologies, such as those encountered in scientific and engineering domains.

To create an entity ontology in QuickGraph, a tree-structured data representation in JSON format is required, as shown below:

```json
[
  {
    "name": "required string",
    "description": "optional string",
    "example_terms": ["optional string"],
    "children": [
      {
        "name": "required string",
        "description": "optional string",
        "example_terms": ["optional string"],
        "children": [
          {
            // Further nested children...
          }
        ]
      }
    ]
  }
]
```

#### Field Descriptions

- `name` (required string): The unique name or label of the entity.
- `description` (optional string): A brief description of the entity, providing context or additional information.
- `example_terms` (optional array of strings): An array containing example terms or instances of the entity.
- `children` (optional array of objects): An array of nested child entities, each following the same structure, allowing for the creation of hierarchical ontologies.

#### Simple Example

This example demonstrates a simple entity ontology with a single entity.

```json
[
  {
    "name": "Person",
    "description": "An individual human being",
    "example_terms": ["Alice", "Bob"]
  }
]
```

#### Advanced Example

This example showcases a more advanced entity ontology with a hierarchy of entities and nested children.

```json
[
  {
    "name": "Organism",
    "description": "A living individual",
    "example_terms": ["human", "dog", "tree"],
    "children": [
      {
        "name": "Animal",
        "description": "A living organism that feeds on organic matter",
        "example_terms": ["dog", "cat", "elephant"],
        "children": [
          {
            "name": "Mammal",
            "description": "A warm-blooded vertebrate animal",
            "example_terms": ["dog", "elephant", "whale"]
          },
          {
            "name": "Bird",
            "description": "A warm-blooded egg-laying vertebrate animal",
            "example_terms": ["eagle", "penguin", "parrot"]
          }
        ]
      },
      {
        "name": "Plant",
        "description": "A living organism that produces its own food through photosynthesis",
        "example_terms": ["tree", "rose", "cactus"]
      }
    ]
  }
]
```

### Relation Ontology

The relation ontology delineates all potential relationships between entities. Since entities can be defined independently of relations, relation ontologies do not include domain and range specifications, e.g. they are decoupled. This approach allows for the reuse of entity and relation resources in any combination. Much like QuickGraph's entity ontologies, relation ontologies can comprise numerous items organized at any arbitrary hierarchical depth. This adaptability enables the annotation of texts using comprehensive ontologies, often found in scientific and engineering domains.

<!-- Each relation has a unique identifier, a label, a description, and domain and range specifications that define the types of entities it can connect. -->

<!-- #### Example

- Relation ID: R1
- Label: born_in
- Description: Indicates that a person was born in a specific location
- Domain: Person
- Range: Location -->

To create a relation ontology in QuickGraph, a tree-structured data representation in JSON format is required, as shown below:

```json
[
  {
    "name": "required string",
    "description": "optional string",
    "children": [
      {
        "name": "required string",
        "description": "optional string",
        "children": [
          {
            // Further nested children...
          }
        ]
      }
    ]
  }
]
```

#### Field Descriptions

- `name` (required string): The unique name or label of the relation.
- `description` (optional string): A brief description of the relation, providing context or additional information.
- `children` (optional array of objects): An array of nested child entities, each following the same structure, allowing for the creation of hierarchical ontologies.

#### Simple Example

This example demonstrates a simple relation ontology with a single relation.

```json
[
  {
    "name": "born_in",
    "description": "Indicates that a person was born in a specific location"
  }
]
```

#### Advanced Example

This example showcases a more advanced relation ontology with a hierarchy of relations and nested children.

```json
[
  {
    "name": "biological_relations",
    "description": "Relations related to biological entities",
    "children": [
      {
        "name": "part_of",
        "description": "Indicates that one entity is a part of another entity"
      },
      {
        "name": "develops_from",
        "description": "Indicates that an entity develops from another entity"
      }
    ]
  },
  {
    "name": "spatial_relations",
    "description": "Relations related to spatial entities",
    "children": [
      {
        "name": "located_in",
        "description": "Indicates that an entity is located within another entity"
      },
      {
        "name": "adjacent_to",
        "description": "Indicates that two entities are adjacent to each other"
      }
    ]
  }
]
```

### Rich Format Ontologies

When an ontology resource is created in QuickGraph, it is initialized in specific formats for both entities and relations. Below are examples of the formats and field descriptions for each.

```json
[
  {
    "name": "Animal",
    "children": [
      {
        // Nested child entities as objects...
      }
    ],
    "description": "A living organism that feeds on organic matter",
    "example_terms": ["dog", "cat", "elephant"],
    "created_at": "2023-04-14T10:20:30Z",
    "updated_at": "2023-04-14T10:20:30Z",
    "id": "a1b2c3d4",
    "fullname": "Organism/Animal",
    "color": "#FF5733",
    "active": true,
    "path": [1, 2]
  }
]
```

#### Field Descriptions

- `name`: The unique name or label of the entity.
- `children`: An array of nested child entities.
- `description`: A brief description of the entity, providing context or additional information.
- `example_terms`: An array containing example terms or instances of the entity.
- `created_at`: The UTC datetime when the entity was created.
- `updated_at`: The UTC datetime when the entity was last updated.
- `id`: An 8-character UUID string that uniquely identifies the entity.
- `fullname`: The hierarchical name of the entity, with forward slashes separating levels (e.g., Organism/Animal).
- `color`: A hexadecimal color code string representing the entity's color.
- `active`: A boolean value indicating if the entity is active or inactive.
- `path`: An array of integers representing the hierarchical path of the entity in the ontology.

For relations:

```json
[
  {
    "name": "located_in",
    "children": [
      {
        // Nested child relations as objects...
      }
    ],
    "description": "Indicates that an entity is located within another entity",
    "created_at": "2023-04-14T10:20:30Z",
    "updated_at": "2023-04-14T10:20:30Z",
    "id": "e5f6g7h8",
    "fullname": "SpatialRelations/LocatedIn",
    "color": "#33A2FF",
    "active": true,
    "path": [1, 1]
  }
]
```

#### Field Descriptions

- `name`: The unique name or label of the relation.
- `children`: An array of nested child relations.
- `description`: A brief description of the relation, providing context or additional information.
- `created_at`: The UTC datetime when the relation was created.
- `updated_at`: The UTC datetime when the relation was last updated.
- `id`: An 8-character UUID string that uniquely identifies the relation.
- `fullname`: The hierarchical name of the relation, with forward slashes separating levels.
- `color`: A hexadecimal color code string representing the relation's color.
- `active`: A boolean value indicating if the relation is active or inactive.
- `path`: An array of integers representing the hierarchical path of the relation in the ontology.

These formats will be provided when resources are downloaded individually or bundled with projects.

### Ontology Modification

QuickGraph provides a flexible approach to ontology resources, allowing project managers to modify them as blueprints or when linked to a project. In addition, this feature supports ontology evolution as annotators gain familiarity with a given corpus during the annotation process. QuickGraph currently supports various operations, including updating existing items or adding new ones.

#### Updating existing items

Fields such as `name`, `description`, `color`, `active`, and `example_terms` can be updated at any time using QuickGraph's user-friendly tree editor, allowing for further refinement, clarification, or removal of redundancy. For instance, enhancing the `name` field for better distinctiveness can improve recognition and application. Similarly, adding or enriching a `description` can make it easier for annotators to choose the correct label.

QuickGraph automatically assigns colors to ontology items, but adjusting them for better distinction between classes can be beneficial, especially for extensive ontologies. Additionally, updating `example_terms` for entity ontologies can assist annotators in recognizing similar entity labels, thereby improving consistency.

The `active` field is used to toggle branches of the resource on and off. This approach preserves existing markup without loss or corruption, as opposed to outright removal. Toggling the `active` field can gradually introduce the ontology to annotators based on its complexity or remove unused or unnecessary labels.

#### Adding additional items

QuickGraph enables project managers to add new ontology items to an existing ontology at any time. This process is carried out through a user-friendly visual tree editor instead of a JSON editor, simplifying the addition of new items.

:::caution
While QuickGraph currently does not support rearrangement of ontology resources, this feature is on the roadmap and can be found under [Planned Features](../planned-features).
:::

## Preannotations

Preannotations are collections of clear, human or machine-generated annotations that facilitate a faster text annotation process. They offer a foundation for annotators, allowing for adjustments or removal as required. QuickGraph supports both entity and relation preannotations. The accuracy of preannotations largely depends on the dataset's context and the degree of ambiguity and context sensitivity of the preannotations themselves. Nevertheless, when applied in appropriate situations, preannotations can significantly enhance annotator consistency and efficiency.

:::caution
Preannotations are currently disabled in the latest release of QuickGraph as we work on enhancements. Please refer to the [Planned Features](../planned-features) section for updates on the progress of this feature.
:::

### Entity Preannotations

Entity preannotations in QuickGraph are straightforward, consisting of a `surface_form` and `label`. When creating an entity preannotation resource, an ontology representing the labels must be available, as this is how QuickGraph validates the data.

:::info
In future updates, QuickGraph will support automatic creation of new or extensions of exisiting entity ontology resources based on the contents of entity preannotations.
:::

#### Example

This example demonstrates a set of entity preannotations.

```json
[
  { "surface_form": "Einstein", "label": "Person" },
  { "surface_form": "Ulm", "label": "City" }
]
```

#### Field Descriptions

- `surface_form`: The textual representation of the entity as it appears in the text.
- `label`: The corresponding label from the entity ontology that describes the surface form.

### Relation Preannotations

Relation preannotations in QuickGraph are more intricate than entity preannotations, consisting of `source_surface_form`, `source_label`, `target_surface_form`, `target_label`, `offset`, and `label`. When creating a relation preannotation resource, ontologies representing both entity and relation labels must be available, as this is how QuickGraph validates the data.

QuickGraph uses an `offset` to minimize false positives, relying on the grammatical offset of word usage. The `offset` is indexed from zero (`0`), where `0` indicates that the source and target are contiguous.

:::info
In future updates, QuickGraph will support automatic creation of new or extensions of existing entity and relation ontology resources based on the contents of relation preannotations.
:::

#### Example

This example demonstrates a set of relation preannotations.

```json
[
  {
    "source_surface_form": "Einstein",
    "source_label": "Person",
    "target_surface_form": "Ulm",
    "target_surface_form": "Location",
    "offset": 5,
    "label": "lives_in"
  },
  {
    "source_surface_form": "Barack Obama",
    "source_label": "Person",
    "target_surface_form": "Washington",
    "target_surface_form": "Location",
    "offset": 2,
    "label": "lives_in"
  }
]
```

#### Field Descriptions

- `source_surface_form`: The textual representation of the source entity as it appears in the text.
- `source_label`: The corresponding label from the entity ontology that describes the source surface form.
- `target_surface_form`: The textual representation of the target entity as it appears in the text.
- `target_label`: The corresponding label from the entity ontology that describes the target surface form.
- `offset`: The grammatical offset between the source and target surface forms, indexed from zero (`0`). A value of `0` indicates that the source and target are contiguous.
- `label`: The corresponding label from the relation ontology that describes the relationship between the source and target entities.

## Constraints

One of QuickGraph's objectives is to promote reusability. As a result, entity and relation ontology resources are separate, allowing for flexible combinations. Consequently, constraint resources need to be explicitly created. Constraints define the rules and limitations for entity and relation annotations in a project, contributing to consistency and accuracy during the annotation process. They also improve efficiency by reducing the time annotators spend navigating ontology resources while annotating. All constraints require ontology resources to be available, as QuickGraph uses them to validate consistency.

:::caution
Preannotations have been disabled for the currently release of QuickGraph pending improvements - please see the [Planned Features](../planned-features) for updates on this feature.
:::

### Entity Constraints

Entity constraints are designed to limit how entities can be applied to text and nested together. They help prevent incorrect or illogical combinations of entity types. For instance, a `Person` cannot be a `Location` at the same time, or a `City` cannot be contained within an `Animal`.

<!-- Entity constraints specify the rules for annotating entities. These can include requirements for entity properties, disallowed overlaps, or restrictions on entity combinations. -->

#### Example

This example demonstrates a set of entity constraints that define exclusions and containment rules.

```json
[
  {
    "domain": "Person",
    "excludes": ["Location", "Organization"],
    "can_contain": ["JobTitle", "Role"]
  },
  {
    "domain": "Location",
    "excludes": ["Person", "Organization"],
    "can_contain": ["City", "Country"]
  },
  {
    "domain": "Organization",
    "excludes": ["Person", "Location"],
    "can_contain": ["Department", "Team"]
  }
]
```

#### Field Descriptions

- `domain`: The primary entity type for which the constraint is being defined.
- `excludes`: An array of entity types that cannot coexist or be nested with the primary entity type specified in the domain field.
- `can_contain`: An array of entity types that are allowed to be nested within the primary entity type specified in the domain field. This field is optional and can be used to define containment rules explicitly.

### Relation Constraints

Relation constraints are designed to limit how relations can be applied between entities. They help prevent incorrect or illogical combinations of entity types in relationships. For example, a `Person` can be `born_in` a `Location`, but a `Person` cannot be `part_of` another `Person`.

#### Example

This example demonstrates a set of relation constraints that define allowed combinations of entity types for specific relations.

```json
[
  {
    "relation": "born_in",
    "domain": "Person",
    "range": ["City", "Country"]
  },
  {
    "relation": "part_of",
    "domain": "Organization",
    "range": ["Industry", "Sector"]
  },
  {
    "relation": "works_for",
    "domain": "Person",
    "range": ["Organization"]
  }
]
```

#### Field Descriptions

- `relation`: The specific relation type for which the constraint is being defined.
- `domain`: The primary entity type that acts as the source of the relation for which the constraint is being defined.
- `range`: An array of entity types that can be the target of the relation for the primary entity type specified in the domain field. These entity types are allowed to be related through the specified relation.

<!-- ### Entity Constraints

### Relation Constraints

Relation constraints define the rules for annotating relations. These can include requirements for domain and range entity types, maximum number of relations between entities, or restrictions on relation combinations.

#### Example

- Constraint: A "born_in" relation can only exist between a person and a location entity. -->
