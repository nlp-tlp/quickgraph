---
title: Ontologies
keywords:
  - quickgraph
  - project
  - creation
  - ontology
  - ontologies
sidebar_position: 3
---

# Project Ontologies

The third stage of initiating a project involves choosing the appropriate **project ontologies** (Figure 1). These ontologies serve as controlled vocabularies for annotating entities and relationships within the dataset. Resources for entity and relationship ontologies are displayed in a table format. The accessible ontology resources are contingent on the task setup chosen in the first step (**details**) and the **dataset** picked in the second step. The following conditions can affect the available ontologies:

- When the task configuration is `entity only` and the dataset is `standard`, all entity ontologies will be accessible, while relation ontologies will be deactivated.
- If the task configuration is `entity and closed relation annotation` with a `standard` dataset, both entity and relation ontologies will be accessible.
- For `preannotated` datasets, the available entity and relation ontologies will be filtered based on whether the preannotated dataset includes linked entity and relation ontologies. Selecting these is mandatory, but they can be altered after being converted into "project resources."

<figure style={{textAlign: "center"}}>
  <img
  src={require('../../../../static/img/interface/projects/project_creator_ontologies_v1.png').default}
  alt="QuickGraph Projects Explorer"
  style={{height:"100%", border: "1px solid lightgrey"}}
  />
  <figcaption>Figure 1: Overview of project ontologies.</figcaption>
</figure>

## Field Descriptions

This section provides an overview of the table columns, which contain information about the available ontologies.

- **Type**: This column indicates whether the resource is an entity or relation ontology.
- **Name**: The name of the ontology resource.
- **Size**: The number of items in the flattened resource, providing an indication of the ontology's complexity.
- **Created By**: The origin of the ontology resource, where `system` denotes the preset ontologies provided by the platform.
- **Examples**: This column displays instances from the resource. Hovering over the examples will reveal all instances in the resource.
- **Last Updated**: The date the ontology resource was last modified.
- **Selection**: A checkmark button that allows users to select the desired resource.

## Selecting Ontologies

To choose the appropriate resources for your project, follow the steps outlined below:

1. Review the table containing the available ontology resources, taking note of the Type, Name, Size, Created By, Examples, and Last Updated columns.
2. Hover over the Examples column for each resource to view instances within that resource. This will help you determine if the resource is suitable for your project.
3. After evaluating the resources based on your project's requirements, click the checkmark button (`✔`) in the Selection column to select the desired ontology resources (see Figure 2).
4. If necessary, you will be required to select multiple resources to be included in your project.
5. Once you have made your selections, proceed to the next step in the project creation process.

By following this process, you can ensure that your project is equipped with the most suitable ontologies to facilitate accurate and efficient annotations.

<figure style={{textAlign: "center"}}>
  <img
  src={require('../../../../static/img/interface/projects/project_creator_ontologies_selected_v1.png').default}
  alt="QuickGraph Projects Explorer"
  style={{height:"100%", border: "1px solid lightgrey"}}
  />
  <figcaption>Figure 2: Example of selected project entity ontology.</figcaption>
</figure>

## Predefined Ontologies

QuickGraph supports numerous predefined ontologies, also known as annotation schemas, for users who are applying standard ontologies to new domains. The list of supported ontologies is constantly growing.

**Supported Entity Ontologies:**

- [CoNLL03](https://aclanthology.org/W03-0419.pdf)
- [SemEval-07 Task 4](https://aclanthology.org/S07-1003.pdf)
- [SemEval-10 Task 8](https://aclanthology.org/S10-1006.pdf)
- [OntoNotes](https://aclanthology.org/N06-2015.pdf)
- [FIGER](https://arxiv.org/pdf/1807.04905.pdf)

**Supported Relation Ontologies:**

- [ConceptNet-5.5](https://arxiv.org/pdf/1612.03975.pdf)
- Coreference
- [SemEval-07 Task 4](https://aclanthology.org/S07-1003.pdf)
- [SemEval-10 Task 8](https://aclanthology.org/S10-1006.pdf)

If you'd like to suggest additional ontologies for inclusion in QuickGraph, please [reach out to us](../../../contact).

:::info
Don't see an ontology? Create a new one by visiting the [Resource Creator](./category/resource-creator) page. This page will guide you through the necessary steps to set up and configure a new ontology resource.
:::

<!-- ## Notes

TODO:

- Add information about preset ontologies and links to their respective resources.
- Add information about constraining relations
- Add information about creating and saving ontologies.
- Outline that ontologies are hierarchical.
- Add information about requesting new presets or mention that they are routinely updated with latest datasets. -->
