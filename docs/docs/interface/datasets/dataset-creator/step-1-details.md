---
title: Details
keywords:
  - quickgraph
  - resources
  - creation
sidebar_position: 1
---

# Dataset Details

:::caution
A visual quick reference guide of this page is coming soon.
:::

The initial step in creating a dataset is defining its **details**. QuickGraph accommodates various stages of annotation project maturity by supporting two core dataset types: **standard** and **annotated**. For more information, visit the[Concepts - Datasets](../../../concepts/datasets) page.

The dataset details comprises the following components:

- `Name`: Assign a unique name to identify the dataset, or choose a randomized name.
- `Description`: (optional)
- `Annotated Dataset`: Specify the type of dataset you wish to create. Options include: `No`, `Yes - Entities`, `Yes - Entities and Relations`. Default `No`.

If `Yes - Enitites` is selected for `Annotated Dataset`:

- `Suggested Annotations`: Specifies whether the dataset should default to setting annotations as `suggested` (annotators need to accept them) or `accepted`.
- `Entity Ontology`: Populated with system and user-created entity ontology resources. One must be selected. This is used to validate the entities in the annotated dataset.

If `Yes - Entities and Relations` is selected for `Annotated Dataset`:

- `Suggested Annotations`: Specifies whether the dataset should default to setting annotations as `suggested` (annotators need to accept them) or `accepted`.
- `Entity Ontology`: Populated with system and user-created entity ontology resources. One must be selected. This is used to validate the entities in the annotated dataset.
- `Relation Ontology`: Populated with system and user-created relation ontology resources. One must be selected. This is used to validate the relations in the annotated dataset.
