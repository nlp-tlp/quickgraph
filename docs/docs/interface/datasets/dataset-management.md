---
title: Dataset Management
description: Dataset Management - Modify contents of existing datasets..
keywords:
  - quickgraph
  - dataset
  - datasets
  - management
sidebar_position: 3
---

# Dataset Management

The **Dataset Management** page contains everything required to manage a dataset including adding and removing dataset items (Figure 1). This page can be accessed in two primary ways:

- All dataset types by navigating to the [Datasets Explorer](./datasets-explorer), locating the dataset of interested and clicking `View`.
- Project datasets can additionally be accessed by the sidebar in the [Project Dashboard](../projects/dashboard/section-7-dataset).

The Dataset Management page consists of two main features:

1. [**Dataset Information Sidebar**](#dataset-information-sidebar): This contains information about the dataset including its details, linked information and metadata.
2. [**Dataset Table**](#table-overview): This provides an interactive tabular view of the dataset items that makeup the dataset, including functionality for adding or removing items, and downloading the dataset.

<figure style={{textAlign: "center"}}>
  <img
  src={require('../../../static/img/interface/datasets/management/main_view_v1.png').default}
  alt="Dataset Management Overview"
  style={{height:"100%", border: "1px solid lightgrey"}}
  />
  <figcaption>Figure 1: Dataset Management Overview.</figcaption>
</figure>

## Dataset Information Sidebar

The Dataset Information sidebar contains pertinent details about the current dataset, including: general information, preprocessing details, linked data details (project, ontology resources), and metadata. It is also where the dataset can be deleted. The information presented in sidebar depends on two characteristics of the dataset, whether it is a blueprint or project dataset, and the dataset type.

### Overview

The table below outlines the information displayed in this section:

|         Blueprint or Project         |                         Dataset Type                         |               Field               | Description                                                                                  | Example                                              |
| :----------------------------------: | :----------------------------------------------------------: | :-------------------------------: | -------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
|                 All                  |                             All                              |               Name                | The name assigned to the dataset.                                                            | `Alice In Wonderland`                                |
|                 All                  |                             All                              |      Description (optional)       | The description assigned to the dataset.                                                     | `Not defined` (default), `This is a test dataset...` |
|                 All                  |                             All                              |               Size                | The number of dataset items contained in the dataset. This will always be greater than zero. | `5`, `1000`                                          |
|                 All                  |                             All                              |           Last Updated            | The datetime since the dataset was last updated.                                             | `2M Ago`                                             |
|  [Project](../../concepts/datasets)  |                             All                              |          Linked Project           | The project that is linked to the dataset.                                                   | `Alice In Wonderland`                                |
| [Blueprint](../../concepts/datasets) | [Preannotated](../../concepts/datasets#preannotated-dataset) |  Linked Entity Ontology Resource  | The entity ontology resource that the dataset was linked to on creation                      | `CoNLL03`                                            |
| [Blueprint](../../concepts/datasets) | [Preannotated](../../concepts/datasets#preannotated-dataset) | Linked Relation Ontology Resource | The relation ontology resource that the dataset was linked to on creation                    | `ConceptNet5`                                        |

:::info
If there is a "read only" chip at the bottom of the Dataset Information Sidebar, this means you lack permission to modify the dataset.
:::

### Preprocessing

The preprocessing section of the sidebar displays the preprocessing steps applied when the dataset was created. If the dataset was uploaded as either a [Rich Dataset](../../concepts/datasets#rich-dataset) or [Preannotated Dataset](../../concepts/datasets#preannotated-dataset) these will not be available and will display `No preprocessing applied`. Otherwise, the operations that have been performed will be presented including: lowercasing, removing duplicate dataset items, removing characters, and the tokenizer used. If the chip has a `✓` it means it has been applied, otherwise it has not.

### Dataset Deletion

The dataset can be deleted by entering its name in the Danger Zone section of the sidebar and then clicking the trash icon. The deletion of blueprint datasets will not impact projects that have been created from them (the datasets are cloned into project datasets). Project datasets cannot be deleted as this would cause the linked project to have no data.

:::caution
Project datasets cannot be removed from projects.
:::

:::warning
Dataset deletion is irreverible and permanent. <strong>Please be certain</strong>.
:::

### Metadata

Metadata about the dataset is contained at the bottom of the sidebar and is rendered as chips. The dataset may show the following `Blueprint`, `Project Dataset`, `Read Only`, `Annotated`.

## Table Overview

Depending on the [dataset type](../../concepts/datasets), different fields will be displayed. The table below describes the fields displayed in the dataset table (Figure 2):

<figure style={{textAlign: "center"}}>
  <img
  src={require('../../../static/img/interface/datasets/management/table_v1.png').default}
  alt="Dataset Management - Table"
  style={{height:"100%", border: "1px solid lightgrey"}}
  />
  <figcaption>Figure 1: Dataset Management - Table.</figcaption>
</figure>

|                                                Dataset Type                                                |          Field          | Description                                                                                                                                    | Example                                                                         |
| :--------------------------------------------------------------------------------------------------------: | :---------------------: | ---------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
|                                                    All                                                     |          Text           | The contents of the dataset item, the text that is annotated.                                                                                  | `The rabbit-hole went straight on...`                                           |
|                                                    All                                                     |         Tokens          | The number of tokens in the dataset item `text`. The number of tokens depends on tokenisation strategy. This will always be greater than zero. | `42`                                                                            |
| [Rich](../../concepts/datasets#rich-dataset), [Preannotated](../../concepts/datasets#preannotated-dataset) | External ID (optional)  | An external ID assigned to the dataset item. These are used to maintain continuity with outside systems.                                       | `Not Assigned` (default), `PU001`                                               |
| [Rich](../../concepts/datasets#rich-dataset), [Preannotated](../../concepts/datasets#preannotated-dataset) | Extra Fields (Optional) | Displays the number of fields in the assigned extra fields object. When present, hovering will reveal the contents of the extra fields.        | `Not Assigned` (default), `Fields: 2 (hover to reveal)`                         |
|                        [Preannotated](../../concepts/datasets#preannotated-dataset)                        | Annotations (Optional)  | The number of annotations (entity and/or relation) associated with the dataset item.                                                           | `E: 0                                                   \| R: 0`, `E: 3 \| R 0` |
|                                                    All                                                     |         Created         | The datetime since the dataset item was created.                                                                                               | `1M ago`, `5h ago`                                                              |

## Dataset Modification

A key feature of QuickGraph is its ability to support annotation projects throughout their lifecycle, this includes modifying the underlying dataset. It also supports improving the efficiency of acquiring datasets by uploading preannotated items that may be distantly supervised or machine annotated by algorithms or machine learning models.

:::tip
For a detailed walkthrough on modifying datasets, including adding and removing items, refer to our [Advanced Tutorial on Dataset Modification](../../advanced-tutorials/adv-tutorial-3-modifying-datasets).
:::

### Adding dataset items

Currently, adding dataset items is restricted to the original dataset type. For example, if the base dataset is "standard" then you'll be restricted to adding newline separated items or rich JSON. Similarly, if the base dataset is either entity or entity and relation annotated, you'll be required to upload data in the respective format. However, the current work around is leaving the "entities" and "relations" empty depending on the data you wish to add.

:::caution
Additional dataset items will need to be [assigned to project annotators](../projects/dashboard/section-4-annotators#assigning-dataset-items-documents) each time they are added.
:::

### Removing dataset items

:::warning
Removing items is permanent and irreversible. All associated annotations will be removed. <strong>Please be cautious</strong>.
:::

To remove items from a dataset, simply click the checkbox next to the item. Please note that at least one item must be on the dataset, so selecting all the dataset items will not permit you to remove the items (you must uncheck at least one item). A work around is to remove all the items but one, upload your desired items and then remove the remaining one that is not required.

<figure style={{textAlign: "center"}}>
  <img
  src={require('../../../static/img/adv-tutorial/modify-dataset/dataset_delete_item_v1.gif').default}
  alt="Advanced Tutorial x"
  style={{height:"100%", border: "1px solid lightgrey"}}
  />
  <figcaption>Figure 1: x.</figcaption>
</figure>

## Dataset download

Clicking on the `Download` button above the Dataset Table will trigger a download of the viewed dataset in JSON format. The dataset contains all pertinent details about the dataset, including project details if the dataset is a Project Dataset. An example of the dataset output is shown below:

```json
{
  "name": "demo",
  "description": "demo w/ extra fields",
  "is_blueprint": false,
  "is_annotated": false,
  "dataset_type": 0,
  "project_id": "1337",
  "_id": "1337",
  "created_by": "dummy-user-1",
  "created_at": "2023-04-11T23:58:04.315000",
  "updated_at": "2023-04-11T23:58:04.315000",
  "preprocessing": {},
  "size": 4,
  "project": {
    ...
  },
  "items": [
    {
      ...
    },
    ...
  ]
}
```
