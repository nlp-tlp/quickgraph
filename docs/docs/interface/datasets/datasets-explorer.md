---
title: Datasets Explorer
description: Datasets Explorer - Centralized hub for managing datasets.
keywords:
  - quickgraph
  - datasets
  - datasets
  - explorer
  - management
sidebar_position: 1
---

# Datasets Explorer

The **Datasets Explorer** page in QuickGraph is a centralised hub for managing all your datasets, including standard, annotated, and preset read-only datasets created by the system. It displays every dataset you've created, have access to, or is provided by the system. If you have no active datasets, the page will prompt you to create a new one.

Three primary elements make up the Datasets Explorer page:

1. [**Filters and Sorting**](#navigation-tools-filters-and-sorting): These allow you to streamline your navigation experience.
2. [**Dataset Cards**](#dataset-card-overview): Each card provides an inclusive summary of a given dataset's key information.
3. [**Dataset Creation**](#creating-new-datasets): Create new datasets, easily.

<figure style={{textAlign: "center"}}>
  <img
  src={require('../../../static/img/interface/datasets/explorer/dataset_explorer_v1.png').default}
  alt="Dataset Explorer"
  style={{height:"100%", border: "1px solid lightgrey"}}
  />
  <figcaption>Figure 1: Datasets Explorer Interface.</figcaption>
</figure>

## Navigation Tools: Filters and Sorting

The table below outlines the filters and sorting options to streamline your navigation experience:

| Category | Feature             | Description                                                                                                                          |
| -------- | ------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| Filter   | Free Text Search    | Quickly find specific datasets by entering keywords or phrases that will match the datasets name or description.                     |
| Filter   | Dataset Type Filter | Narrow down the list of datasets based on their types (`Standard` or `Annotated`, see [Concepts - Dataset](../../concepts/datasets)) |
| Filter   | Created By Filter   | Filter datasets by their creators.                                                                                                   |
| Filter   | Size Filter         | Filter datasets by their size.                                                                                                       |
| Sort     | Last Updated Date   | Sort your datasets according to their most recent update, ensuring you stay up-to-date with the latest changes.                      |
| Sort     | Size                | Sort your datasets according to their size.                                                                                          |
| Sort     | Created By          | Sort your datasets according to their creator.                                                                                       |

## Dataset Card Overview

Contained in the table below is a detailed outline of the key information displayed on each dataset card:

| Dataset Card Information | Description                                                                                                                                        |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Dataset Name             | The designated name of the dataset.                                                                                                                |
| Dataset Size             | The total size of the dataset.                                                                                                                     |
| Dataset Creator          | The individual or entity responsible for creating the dataset.                                                                                     |
| Dataset Type             | The specific category of the dataset - either `Standard` or `Annotated` (refer to [Concepts - Dataset](../../concepts/datasets) for more details). |
| Dataset Description      | A brief summary providing insights about the dataset.                                                                                              |
| Last Update              | The duration since the dataset was most recently updated.                                                                                          |

In addition to this core information, each dataset card incorporates distinctive metadata tags located at the bottom. These tags quickly indicate if a dataset is `Annotated`, linked to a `Project`, or a `Blueprint`. A quick link to `View` the dataset is also located here, which redirects you to a dedicated [page for managing the dataset](./dataset-management), ensuring seamless navigation and efficient management.

## Creating New Datasets

You can easily create new datasets by clicking the `Create New Dataset` card. This will redirect you to the [Dataset Creator](/category/dataset-creator) which guides you through the necessary steps to set up and configure a new dataset, ready to be deployed in your annotation projects.
