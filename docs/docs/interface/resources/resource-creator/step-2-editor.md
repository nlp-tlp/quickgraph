---
title: Editor
sidebar_position: 2
---

# Editor

The **Resource Editor** is used to specify the contents of the desired resource. Resources can be uploaded by clicking the `Upload` button or pasted directly into the editor. Depending on the resource type, the editor will expect a certain format (see the table below).

| Resource Type           | Accepted Formats | Example Input Format                                                                                 |
| ----------------------- | ---------------- | ---------------------------------------------------------------------------------------------------- |
| Entity Ontology         | JSON             | [Concepts - Resources: Entity Ontology](../../../concepts/resources#entity-ontology)                 |
| Relation Ontology       | JSON             | [Concepts - Resources: Relation Ontology](../../../concepts/resources#relation-ontology)             |
| Entity Preannotations   | JSON, CSV\*      | [Concepts - Resources: Entity Preannotations](../../../concepts/resources#entity-preannotations)     |
| Relation Preannotations | JSON, CSV\*      | [Concepts - Resources: Relation Preannotations](../../../concepts/resources#relation-preannotations) |
| Entity Constraints      | JSON             | [Concepts - Resources: Entity Constraints](../../../concepts/resources#relation-constraints)         |
| Relation Constraints    | JSON             | [Concepts - Resources: Relation Constraints](../../../concepts/resources#relation-constraints)       |

:::info
\*CSV format for preannotations is currently under development.
:::

The Editor has the following quality of life features - **prettify** function which formats JSON content to an easily readable format, and **statistics** which provide an overview of the contents such as size and depth.

## Validation

The editor is accompanied by a validator which checks the consistency of the resource contents. For all resources, it ensures that the JSON format is correct. For some resources, such as preannotations and constraints, it will check that the any labels are consistent with the seleced pre-existing ontology resources specified in the details section.
