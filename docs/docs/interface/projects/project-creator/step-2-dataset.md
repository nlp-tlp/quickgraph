---
title: Dataset
keywords:
  - quickgraph
  - project
  - creation
  - dataset
sidebar_position: 2
---

# Project Dataset

The second stage of project creation requires selecting a **project dataset** (Figure 1). Both user-generated and system-provided datasets are presented in a table format.

<figure style={{textAlign: "center"}}>
  <img
  src={require('../../../../static/img/interface/projects/project_creator_dataset_v1.png').default}
  alt="QuickGraph Projects Explorer"
  style={{height:"100%", border: "1px solid lightgrey"}}
  />
  <figcaption>Figure 1: Overview of project dataset view.</figcaption>
</figure>

## Field Descriptions

- **Name**: Displays the dataset's name. Clicking the name directs you to the [datasets management](../../datasets/dataset-management) page.
- **Description**: Provides a brief overview of the dataset.
- **Size**: Indicates the number of items in the dataset.
- **Annotated**: Specifies whether the dataset is `standard` (`false`) or `preannotated` (`true`). For `preannotated` datasets, ontologies in the next step will be limited to those linked to the preannotated dataset.
- **Created By**: Shows the dataset's creator, with the term `system` denoting system-generated datasets.
- **Projects**: Displays the number of projects associated with the dataset, considering that datasets can serve as blueprints for multiple projects using copies of the dataset.
- **Last Updated**: Reveals when the dataset was last modified.
- **Selection**: A button for selecting the desired dataset.

## Selecting a dataset

To choose the best dataset for your project, follow the steps outlined below:

1. Examine the table containing available datasets, taking note of the Name, Description, Size, Annotated, Created By, Projects, and Last Updated columns.
2. Assess each dataset based on your project's requirements, considering factors such as size, annotations, and relevance.
3. Once you've identified the most suitable dataset, click the checkmark button (`✔`) in the Selection column to select it.
4. Upon selection, the chosen row will change color, and all other rows will appear faded, indicating your selection (see Figure 2).
5. Proceed to the next step in the project creation process.

By following this process, you can ensure that your project is equipped with the most appropriate dataset to support effective and accurate annotations.

An example of a selected dataset is shown below:

<figure style={{textAlign: "center"}}>
  <img
  src={require('../../../../static/img/interface/projects/project_creator_dataset_selected_v1.png').default}
  alt="Example of selected project dataset"
  style={{height:"100%", border: "1px solid lightgrey"}}
  />
  <figcaption>Figure 2: Example of selected project dataset.</figcaption>
</figure>

:::info
Don't see a dataset? Create a new one by visiting the [Dataset Creator](/category/dataset-creator) page. This page will guide you through the necessary steps to set up and configure a new dataset.
:::
