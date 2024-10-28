---
title: Resources Explorer
sidebar_position: 1
---

# Resources

The **Resources Page** in QuickGraph serves as a centralised hub for managing all your resources (Figure 1). This includes resources created by you, resources you have access to, and system-provided read-only resources. If you have no active resources, the page will prompt you to create a new one. It's important to note that the Resource Explorer only displays [blueprint resources](../../concepts/resources). To access project resources, please visit the [Project Dashboard](../projects/dashboard/section-9-resources).

The Resource Explorer consists of three main components:

1. [**Filters and Sorting**](#navigation-tools-filters-and-sorting): These allow you to streamline your navigation experience.
2. [**Resource Cards**](#resource-card-overview): Each card provides a comprehensive summary of the key details related to a specific resource.
3. [**Resource Creation**](#creating-new-resources): This allows you to create new resources with ease.

:::info
QuickGraph resources are currently being enhanced for improved performance. We appreciate your patient during this period. At present, this page is confined to ontology resources, but updates will be rolled out as part of the [Planned Features](../../planned-features) roadmap to include preannotations and constraints.
:::

<figure style={{textAlign: "center"}}>
  <img
  src={require('../../../static/img/interface/resources/explorer/resources_explorer_v1.png').default}
  alt="Resources Explorer"
  style={{height:"100%", border: "1px solid lightgrey"}}
  />
  <figcaption>Figure 1: Resources Explorer Interface.</figcaption>
</figure>

## Navigation Tools: Filters and Sorting

The table below outlines the filters and sorting options to streamline your navigation experience:

| Category | Feature           | Description                                                                                                                  |
| -------- | ----------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Filter   | Free Text Search  | Quickly locate specific resources by entering keywords or phrases that correspond to the resources name or description.      |
| Filter   | Resource Type     | Filter the resources based on their type: `Ontology`, `Preannotation`, `Cosntraint`, `Everything` (default is `Everything`). |
| Filter   | Resource Sub-Type | Filter resources by their sub-types: `Entity`, `Relation`, `Everything` (default is `Everything`).                           |
| Filter   | Created By        | Filter resources based on their creator's username.                                                                          |
| Sort     | Last Updated Date | Sort your resources according to their most recent update, ensuring you stay up-to-date with the latest changes.             |
| Sort     | Size              | Sort resources by their size (number of classes).                                                                            |
| Sort     | Created By        | Sort resources based on their creator's username.                                                                            |

## Resource Card Overview

Contained in the table below is a detailed outline of the key information displayed on each resource card:

| Resource Card Information | Description                                                                        |
| ------------------------- | ---------------------------------------------------------------------------------- |
| Resource Name             | The designated name of the resource.                                               |
| Resource Size             | The total size of all classes or instances in the resource.                        |
| Resource Creator          | The individual or entity responsible for creating the resource.                    |
| Last Updated              | The duration since the resource was most recently updated.                         |
| Instances                 | A preview of the instances contained within the resource (_hover to reveal more_). |
| Resource Type             | The type of resource (`ontology`, `preannotation`, `constraint`).                  |
| Resource Sub-type         | The sub-type of the resource (`entity` or `relation`).                             |

Each resource card also contains distinct metadata tags located at the bottom. These tags provide a quick reference to the resource's type and sub-type. A `View` link is also available, leading you to a dedicated [page for managing the resource](../resources/resource-management), thereby ensuring easy navigation and efficient resource management.

## Creating New Resources

You can easily create new resources by clicking the `Create New Resource` card. This will redirect you to the [Resource Creator](/category/resource-creator/) which guides you through the necessary steps to set up and configure a new resource for use in your annotation projects.
