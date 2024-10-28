---
title: Resource Management
---

# Resource Management

The **Resource Management** page equips you with the necessary tools for comprehensive management of [blueprint resources](../../concepts/resources), including updating, adding, or removing instances (Figure 1). It is important to note that the Resource Management page exclusively displays [blueprint resources](../../concepts/resources). To access project resources, please visit the [Project Dashboard](/category/dashboard/). For managing project resources, the relevant view will appear within the Project Dashboard, simplifying the handling of projets with multiple resources.

:::info
QuickGraph resources are currently undergoing performance improvements. We appreciate your patient during this process. At this point, this page is limited to ontology resources, but future updates, as outlined in the [Planned Features](../../planned-features) roadmap, will encompasspreannotations and constraints.
:::

The Resource Management page is organised into two primary sections:

1. [**Resource Information Sidebar**](#resource-information-sidebar): This includes details and metadata about the resource.
2. [**Resource Editor**](#resource-editor): This interactive tool allows you to edit resources, including updating, adding, or removing instances.

<figure style={{textAlign: "center"}}>
  <img
  src={require('../../../static/img/interface/resources/management/resource_management_overview_v1.png').default}
  alt="Resource Management Overview"
  style={{height:"100%", border: "1px solid lightgrey"}}
  />
  <figcaption>Figure 1: Resource Management Overview.</figcaption>
</figure>

## Resource Information Sidebar

The Resource Information sidebar presents revevant details about the current resource, such as general information and metadata. It is also where the resource can be deleted. The information displayed in the sidebar depends on the nature of the resource, and whether it's a [blueprint or a project resource](../../concepts/resources).

### Overview

The table below outlines the information displayed in this section:

| Resource Type |         Field          | Description                                       | Example                                               |
| :-----------: | :--------------------: | ------------------------------------------------- | ----------------------------------------------------- |
|      All      |          Name          | The name assigned to the resource.                | `Alice In Wonderland`                                 |
|      All      | Description (optional) | The description assigned to the resource.         | `Not defined` (default), `This is a test resource...` |
|      All      |          Type          | The type of resource.                             | `ontology`, `preannotation`, `constraint`             |
|      All      |        Sub-type        | The sub-type of the resource.                     | `entity` or `relation`                                |
|      All      |      Last Updated      | The datetime since the resource was last updated. | `2M Ago`                                              |
|      All      |        Created         | The datetime since the resource was created.      | `5M Ago`                                              |

### Resource Deletion

A resource can be deleted by entering its name in the Danger Zone section of the sidebar and then clicking the trash icon. Deleting blueprint resources will not affect projects that have been created from them as resources are cloned into project resources. Project resources cannot be deleted as this would leave the linked project resource-less.

:::caution
Project resources cannot be removed from projects.
:::

:::warning
Resource deletion is irreversible and permanent. <strong>Please be certain</strong>.
:::

### Metadata

Metadata about the resource is displayed at the bottom of the sidebar and is shown as chips. Each resource will display one chip for the `type` and one for the `sub-type`. An additional chip will be shown if the resource is `Read-Only`, indicating that no CRUD operations can be performed.

## Resource Editor

The interface of the Resource Editor adapts dynamically depending on the resource type (ontology, preannotations, constraints). The folllowing sections outline these interfaces and their respective functionalities.

### Ontology Editor

<figure style={{textAlign: "center"}}>
  <img
  src={require('../../../static/img/interface/resources/management/ontology_editor_v1.png').default}
  alt="Resource Ontology Editor"
  style={{height:"100%", border: "1px solid lightgrey"}}
  />
  <figcaption>Figure 2: Resource Ontology Editor.</figcaption>
</figure>

The ontology editor is a visual tree editor designed to manage hiearchical entity and relation ontologies. The primary features of the Ontology Editor include:

#### Hiearchy Management

:::tip
To view an example of Ontology Resource Modification, refer to the [Advanced Tutorial](../../advanced-tutorials/adv-tutorial-2-modifying-ontology-resources).
:::

The ontology editor supports the management of hierarchies of any size, enabling you to:

1. Expand and collapse individual items and branches.
2. Add top-level root nodes.
3. Update tree item names, colours, and descriptions.
4. Disable items or entire branches.

:::info
You have the flexibility to dynamically adapt project ontologies as your projects advance, by performing any of these operations at any time. Simply interact with your project resource(s) located in the [Project Dashboard - Resources](../projects/dashboard/section-9-resources).
:::

#### Summary Statistics

Summary statistics are updating in real-time, providing an insight into your ontology by displaying its maximum depth and number of items. This can be useful to gauge the ontologies complexity/topology.

#### Download

The entire ontology can be downloaded by clicking the `Download` button, triggering a JSON format download. An example output is shown below:

```json
[
  {
    "id": "91d6aecb",
    "name": "Character",
    "fullname": "Character",
    "description": "Distinctive individuals, animals, or imaginary creatures that play a role in the story, each possessing unique traits and attributes.",
    "example_terms": [],
    "color": "#f60748",
    "active": true,
    "children": [
      {
        "id": "727dd54b",
        "name": "Name",
        "fullname": "Character/Name",
        "description": "",
        "example_terms": [],
        "color": "#f60748",
        "active": true,
        "children": [],
        "path": [0, 0]
      },
      {
        "id": "1f559050",
        "name": "Role",
        "fullname": "Character/Role",
        "description": "",
        "example_terms": [],
        "color": "#f60748",
        "active": true,
        "children": [],
        "path": [0, 1]
      },
      {
        "id": "2738cbf1",
        "name": "Species",
        "fullname": "Character/Species",
        "description": "",
        "example_terms": [],
        "color": "#f60748",
        "active": true,
        "children": [],
        "path": [0, 2]
      }
    ],
    "path": [0]
  }
  // More ontology items...
]
```

#### Miscellaneous

The `Expand All` and `Collapse All` buttons are quality of life features that facilitate expanding and collapsing the entire tree.

### Preannotation Editor

:::info
QuickGraph resources are currently undergoing performance enhancements. We appreciate your patient during this period. At present, this page is confined to ontology resources, but updates will be rolled out as part of the [Planned Features](../../planned-features) roadmap to include preannotations and constraints.
:::

### Constraint Editor

:::info
QuickGraph resources are currently undergoing performance enhancements. We appreciate your patient during this period. At present, this page is confined to ontology resources, but updates will be rolled out as part of the [Planned Features](../../planned-features) roadmap to include preannotations and constraints.
:::
