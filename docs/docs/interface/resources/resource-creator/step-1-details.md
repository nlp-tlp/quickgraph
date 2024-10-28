---
title: Details
keywords:
  - quickgraph
  - resources
  - creation
sidebar_position: 1
---

# Details

The details page requires you to specify the `Resource Type`, `Resource Sub Type` and `Name`. Currently, two Resource Types are supported `Ontology` and `Preannotation` (see [Concepts - Resources](../../../concepts/resources) for more information about QuickGraph resource types). Clicking the dice icon will randomly generate a name for the resource.

## Resource Type - Ontology

Selecting the `Ontology` Resource Type will allow you to specify whether you want to create an `entity ontology` or `relation ontology`.

## Resource Type - Preannotation

Selecting the `Preannotation` Resource Type will present a new mandatory selection field called `Select Existing Entity Ontology`. Here, an existing entity ontology must be selected before creating the new resource. If a suitable entity ontology does not exist, you must create one. The **Resource Editor** uses this to validate your preannotations to ensure they are consistent and no conflicts occur when the preannotation resource is used on future projects.

<!-- :::info
Only entity preannotations are currently supported. See the [Planned Features](../../../planned-features) for updates on this feature.
::: -->

:::info
This feature is currently disabled as it undergoes performance and reliability improvements. See the [Planned Features](../../../planned-features) for updates on this feature.
:::
