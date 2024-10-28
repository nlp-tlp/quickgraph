---
sidebar_position: 2
---

# Datasets

This section provides a comprehensive overview of the different dataset types available in QuickGraph. These datasets are designed as flexible and reusable components that can be used across multiple projects. When initially created, a dataset acts as a "blueprint" that can be dynamically updated through CRUD-like operations. Once assigned to a specific project, the "blueprint" dataset is copied into a "project" dataset, customised for that particular project's requirements.

## Standard Dataset

The Standard Dataset only requires newline-separated content.

### Example

```txt
Albert Einstein was born in Ulm, Germany, and developed the theory of relativity.
The Amazon rainforest, located in South America, is the world's largest tropical rainforest and is home to countless plant and animal species.
Apple Inc., founded by Steve Jobs, Steve Wozniak, and Ronald Wayne, is a multinational technology company headquartered in Cupertino, California.
The Great Barrier Reef, situated off the coast of Queensland, Australia, is the world's largest coral reef system and is visible from outer space.
```

## Rich Dataset

The Rich Dataset is an extension of the **Standard Dataset** and supports additional supplementary information. This dataset requires data to be in JSON format and must contain keys such as `original` and `tokens`.

### Example

```json
[
  {
    "original": "Albert Einstein was born in Ulm, Germany.",
    "tokens": [
      "Albert",
      "Einstein",
      "was",
      "born",
      "in",
      "Ulm",
      ",",
      "Germany",
      "."
    ],
    "external_id": "doc_001",
    "extra_fields": { "author": "John Doe", "publication_date": "2023-04-15" }
  },
  {
    "original": "The Amazon rainforest is home to countless plant and animal species.",
    "tokens": [
      "The",
      "Amazon",
      "rainforest",
      "is",
      "home",
      "to",
      "countless",
      "plant",
      "and",
      "animal",
      "species",
      "."
    ],
    "external_id": "doc_002",
    "extra_fields": { "author": "Jane Smith", "publication_date": "2023-04-16" }
  }
  //   Additional dataset items
]
```

### Field Descriptions

- `original`: String - The original text before tokenisation.
- `tokens`: Array - A list of tokens derived from the original text after tokenisation.
- `external_id`: (Optional) String - An external UUID associated with the document.
- `extra_fields`: (Optional) Object - A collection of arbitrary additional information in key-value pairs.

## Preannotated Dataset

The Preannotated Dataset is an extension of the **Rich Dataset**, with each dataset item containing the keys `entities` and/or `relations`. Both variants of this dataset type require ontology resources to be available for QuickGraph to validate the consistency of the provided labels.

### Preannotated Entity Dataset

The Preannoated Entity Dataset only requires the additional key `entities`. Upon upload, an entity ontology representing the `labels` in the dataset must be available.

#### Example

```json
[
  {
    "original": "Albert Einstein was born in Ulm, Germany.",
    "tokens": [
      "Albert",
      "Einstein",
      "was",
      "born",
      "in",
      "Ulm",
      ",",
      "Germany",
      "."
    ],
    "external_id": "doc_001",
    "extra_fields": { "author": "John Doe", "publication_date": "2023-04-15" },
    "entities": [
        {
            "start": 0, "end": 1, "label": "Person"
        },
        {
            "start": 5, "end": 5, "label": "Location/State"
        }
        {
            "start": 7, "end": 7, "label": "Location/Country"
        }
    ]
  },
  {
    "original": "The Amazon rainforest is home to countless plant and animal species.",
    "tokens": [
      "The",
      "Amazon",
      "rainforest",
      "is",
      "home",
      "to",
      "countless",
      "plant",
      "and",
      "animal",
      "species",
      "."
    ],
    "external_id": "doc_002",
    "extra_fields": { "author": "Jane Smith", "publication_date": "2023-04-16" },
        "entities": [
    ]
  }
    //   Additional dataset items
]
```

#### Field Descriptions

- `original`: String - The original text before tokenisation.
- `tokens`: Array - A list of tokens derived from the original text after tokenisation.
- `external_id`: (Optional) String - An external UUID associated with the document.
- `extra_fields`: (Optional) Object - A collection of arbitrary additional information in key-value pairs.
- `entities`: Array - A list of objects containing preannoated entity information. Each object has the following properties:
  - `start`: The starting token index of the entity, with the count beginning at 0.
  - `end`: The ending token index of the entity. Note this uses a closed, inclusive range for the indices.
  - `label`: The fullname of the corresponding entity in the entity ontology resource. Hierarchical levels are represented by forward slashes to denote the level.

### Preannoted Relation Dataset

The Preannoated Relation Dataset requires the additional keys `entities` and `relations`. Upon upload, entity and relation ontologies representing the `labels` in the dataset must be available.

:::info
Items in this datasets `entities` array have an extra field called `id` which allows the relations to be referenced correctly. This is not required for Preannotated Entity Datasets.
:::

#### Example

```json
[
  {
    "original": "Albert Einstein was born in Ulm, Germany.",
    "tokens": [
      "Albert",
      "Einstein",
      "was",
      "born",
      "in",
      "Ulm",
      ",",
      "Germany",
      "."
    ],
    "external_id": "doc_001",
    "extra_fields": { "author": "John Doe", "publication_date": "2023-04-15" },
    "entities": [
        {
            "start": 0, "end": 1, "label": "Person", "id": "0",
        },
        {
            "start": 5, "end": 5, "label": "Location/State", "id": "1",
        }
        {
            "start": 7, "end": 7, "label": "Location/Country", "id": "2"
        }
    ],
    "relations": [
      { "source_id": "0", "target_id": "1", "label": "located_in" },
      { "source_id": "1", "target_id": "2", "label": "located_in" },
    ]
  },
  {
    "original": "The Amazon rainforest is home to countless plant and animal species.",
    "tokens": [
      "The",
      "Amazon",
      "rainforest",
      "is",
      "home",
      "to",
      "countless",
      "plant",
      "and",
      "animal",
      "species",
      "."
    ],
    "external_id": "doc_002",
    "extra_fields": { "author": "Jane Smith", "publication_date": "2023-04-16" },
        "entities": [
    ]
  }
    //   Additional dataset items
]
```

##### Field Descriptions

- `original`: String - The original text before tokenisation.
- `tokens`: Array - A list of tokens derived from the original text after tokenisation.
- `external_id`: (Optional) String - An external UUID associated with the document.
- `extra_fields`: (Optional) Object - A collection of arbitrary additional information in key-value pairs.
- `entities`: Array - A list of objects containing preannoated entity information. Each object has the following properties:
  - `start`: Integer - The starting token index of the entity, with the count beginning at 0.
  - `end`: Integer - The ending token index of the entity. Note this uses a closed, inclusive range for the indices.
  - `label`: String - The fullname of the corresponding entity in the ontology resource. Hierarchical levels are represented by forward slashes to denote the level.
  - `id`: String - The UUID of the entity.
- `relations`: Array - A list of objects containing preannoated relation information. Each object has the following properties:
  - `source_id`: String - The source entities UUID.
  - `target_id`: String - The target entities UUID.
  - `label`: String - The fullname of the corresponding relation in the relation ontology resource. Hierarchical levels are represented by forward slashes to denote the level.

<!-- Planned features to tokenise rich datasets -->
<!-- Make the overview not seem like only the blueprint can be modified -->

## Dataset Modification

QuickGraph provides a flexible approach to datasets, allowing project managers to modify them as blueprints or when linked to a project. In addition, this feature supports dataset evolution as annotators gain familiarity with a given corpus during the annotation process. QuickGraph currently supports various operations, including adding and removing dataset items.

### Adding dataset items

To add dataset items, project managers can use the user-friendly interface provided by QuickGraph to insert new content into the dataset. This can be done by either manually entering new items or importing data from external sources. Once added, these new items will be available for annotators to work on within the project, allowing for continuous improvement and expansion of the dataset.

### Removing dataset items

QuickGraph enables project managers to remove dataset items as needed, ensuring that the dataset remains relevant and up-to-date. This can be done through the dataset management interface, where items can be selected and removed with just a few clicks. This feature helps maintain the quality of the dataset by allowing the removal of outdated, irrelevant, or erroneous content, ensuring that annotators focus on the most important and accurate information.

## Dataset preprocessing

QuickGraph offers built-in preprocessing capabilities for standard datasets, such as those consisting of newline-separated texts. These preprocessing steps can be applied without relying on third-party software or programming environments. The following operations are available for this dataset type:

:::info
Note that preprocessing is only available for datasets pasted into the dataset editor or uploaded as a newline-separated text file.
:::

### Case removal (lower casing)

This operation converts all text in the dataset to lowercase, effectively removing case distinctions. For example, `Barack Obama is the president` will be transformed into `barack obama is the president`.

**Pros**

- Consistency: Converting all text to lowercase can improve consistency across dataset items, making it easier for annotators and algorithms to process the text.
- Enhanced annotation propagation: Lowercasing can improve the effectiveness of annotation propagation, as it reduces the impact of character case differences between similar texts.

**Cons**

- Loss of information: Case removal might eliminate important distinctions between proper nouns, acronyms, and domain-specific terminology, which could be relevant to the annotation task or the performance of downstream algorithms.
- Ambiguity: Converting all text to lowercase can introduce ambiguity, as it might make it more difficult for annotators to differentiate between proper nouns and common nouns or between acronyms and regular words. This could lead to confusion and potential errors during the annotation process.

### Duplicate removal

As mentioned earlier, once preprocessing is applied to a dataset, some items may have identical contents. The duplicate removal operation eliminates these redundancies, improving annotator efficiency. For instance, consider a dataset with two items:

```
replace engine oil
REPLACE ENGINE OIL
```

After performing case removal, this will result in:

```
replace engine oil
replace engine oil
```

Therefore, removing duplicates is desirable, as it reduces redundant annotation efforts by 50%.

**Pros**

- Efficiency: Removing duplicate items from the dataset reduces the time and effort required by annotators, as they won't need to annotate the same text multiple times.
- Quality: Eliminating duplicates ensures that the annotated dataset is more diverse, which can lead to better training data for machine learning models.

**Cons**

- Context sensitivity: In some cases, duplicates might have different meanings or annotations depending on their context. Automatically removing duplicates might inadvertently eliminate these subtle differences.
- Overzealous pruning: If the dataset is small or the preprocessing steps are too aggressive, duplicate removal might reduce the dataset size significantly, potentially impacting the model's performance.

### Character removal

QuickGraph enables the removal of specific characters to improve dataset quality. For instance, consider the following dataset:

```
$$$replace engine oil
replace engine oil
```

By removing characters such as $ that do not contribute to the meaning of the text, annotator performance can be enhanced, especially when combined with duplicate removal:

```
replace engine oil
replace engine oil
```

**Pros**

- Noise reduction: Removing irrelevant or unnecessary characters can reduce noise in the dataset, making it easier for annotators to focus on the meaningful content.
- Consistency: Character removal can improve consistency across dataset items by eliminating unwanted characters or symbols that may have been introduced during data collection or preprocessing.

**Cons**

- Loss of information: In some cases, the removed characters might carry meaning or be part of domain-specific terminology. Automatic character removal could inadvertently eliminate essential information.
- Misinterpretation: Character removal might change the meaning or context of the text, leading to incorrect annotations or misinterpretation by annotators.

:::tip
When handling noisy datasets, consider removing characters that do not add value to the text's meaning. However, be cautious with characters like hyphens, periods, and forward slashes, as they may appear in legitimate words.
:::

### Tokenisation

Tokenisation is the process of splitting a text into smaller units called tokens. These tokens usually represent words or punctuation marks. QuickGraph offers two types of tokenisation: whitespace-based and Punkt-based.

:::tip
Punkt-based tokenisation is recommended for most datasets.
:::

#### Whitespace-based Tokenisation

This method splits the text into tokens based on whitespace characters, such as spaces, tabs, and line breaks.

Example
Input text: `Albert Einstein was born in Ulm, Germany.`

Output tokens: `["Albert", "Einstein", "was", "born", "in", "Ulm,", "Germany."]`

**Pros**

- Simplicity: Whitespace-based tokenisation is easy to implement and understand, making it a suitable choice for simple text processing tasks.

**Cons**

- Inaccuracy: Whitespace-based tokenisation might not accurately capture all tokens, particularly in languages that do not use spaces between words or where punctuation is attached to words (e.g., commas, periods, and quotes).
- Inconsistency: Tokenisation results may vary based on the formatting and writing conventions used in the dataset, leading to potential inconsistencies across dataset items.

#### Punkt-based Tokenisation

Punkt tokenisation is a more advanced technique that takes into account punctuation marks, abbreviations, and other linguistic cues to create a more accurate tokenisation of the text.

Example
Input text: `Albert Einstein was born in Ulm, Germany.`

Output tokens: `["Albert", "Einstein", "was", "born", "in", "Ulm", ",", "Germany", "."]`

**Pros**

- Accuracy: Punkt-based tokenisation generally provides more accurate results than whitespace-based tokenisation, as it considers linguistic cues and punctuation marks.
- Consistency: By considering linguistic cues, Punkt tokenisation helps create more consistent results across different dataset items and writing conventions.

**Cons**

- Complexity: Punkt tokenisation is more complex than whitespace-based tokenisation and might require additional resources, such as language-specific data and pre-trained models, to achieve optimal results.
