---
title: Overview
keywords:
  - quickgraph
  - project
  - dashboard
  - overview
sidebar_position: 1
---

# Overview

The **overview page** (Figure 1) of the project dashboard provides a comprehensive snapshot of your project's status and progress. It includes high-level metrics and visualisations that offer insights into various aspects of the annotation process, making it an essential tool for monitoring your project's performance.

<figure style={{textAlign: "center"}}>
  <img
  src={require('../../../../static/img/interface/dashboard/dashboard_overview_v1.png').default}
  alt="QuickGraph Dashboard Overview"
  style={{height:"100%", border: "1px solid lightgrey"}}
  />
  <figcaption>Figure 1: Project dashboard - Overview.</figcaption>
</figure>

## High-Level Metrics

<figure style={{textAlign: "center"}}>
  <img
  src={require('../../../../static/img/interface/dashboard/dashboard_overview_metrics_v1.png').default}
  alt="QuickGraph Dashboard Overview - Metrics"
  style={{height:"100%"}}
  />
  <figcaption>Figure 2: Project dashboard overview - Summary metrics.</figcaption>
</figure>

The high-level metrics displayed on the overview page give a quick understanding of your project's current state. These metrics include:

- **Project Progress**: A percentage that represents the overall completion of the project. This only considers dataset items that have met the minimum number of annotators.
- **Overall Agreement**: A measure of how consistently annotators are labeling the same data. For `entity annotation only` projects, this will be equivalent to the `entity agreement`. Whereas for `entity and relation annotation` projects, this is currently the average entity and relation agreement.
- **Entity Agreement**: A measure of the consistency among annotators for entity annotation tasks.
- **Relation Agreement**: A measure of the consistency among annotators for relation annotation tasks.
- **Entities Created**: The total number of entities annotated in the project that have majority agreement.
- **Triples Created**: The total number of triples (entity-relation-entity) annotated in the project that have majority agreement.

:::caution
Note that if the project task is `entity annotation only`, the Entity Agreement, Relation Agreement, and Triples Created metrics will **not** be displayed.
:::

<!-- :::info
See the guide [calculating agreement]() for more information on how QuickGraph computes agreement.
::: -->

<!-- See the guide [understanding annotation quality](/guides/annotation-quality) to find out more about entity qualities. -->

## Visualisations

The overview page also features a variety of plots that provide a deeper understanding of the project's progress and annotator performance. These plots include:

### Project Progress Over Time

A bar chart that shows the daily progress (saved dataset items) made by all annotators. Only days where annotations are made are displayed.

<figure style={{textAlign: "center"}}>
  <img
  src={require('../../../../static/img/interface/dashboard/dashboard_overview_progress_plot_v1.png').default}
  alt="QuickGraph Dashboard Overview - Progress Plot"
  style={{height:"100%"}}
  />
  <figcaption>Figure 3: Project dashboard overview - Progress plot.</figcaption>
</figure>

### Distribution of Applied Entities (Silver and Weak Quality)

A bar chart displaying the distribution of applied entities for all annotators, separated into silver and weak quality annotations. The interactive x-axis brush allows navigation and zooming of entities.

<figure style={{textAlign: "center"}}>
  <img
  src={require('../../../../static/img/interface/dashboard/dashboard_overview_entity_plot_v1.png').default}
  alt="QuickGraph Dashboard Overview - Entity Plot"
  style={{height:"100%"}}
  />
  <figcaption>Figure 4: Project dashboard overview - Entity plot.</figcaption>
</figure>

### Distribution of Applied Relations (Silver and Weak Quality)

A bar chart showing the distribution of applied relations for all annotators, separated into silver and weak quality annotations. The interactive x-axis brush allows navigation and zooming of relations.

<figure style={{textAlign: "center"}}>
  <img
  src={require('../../../../static/img/interface/dashboard/dashboard_overview_relation_plot_v1.png').default}
  alt="QuickGraph Dashboard Overview - Relation Plot"
  style={{height:"100%"}}
  />
  <figcaption>Figure 5: Project dashboard overview - Relation plot.</figcaption>
</figure>

<!-- ### Top 25 Triple Structures Applied

A horizontal bar chart showcasing the 25 most frequently applied triple structures in the project. -->

### Distribution of Flags Applied by Each Annotator

A stacked bar chart illustrating the distribution of flags applied to each dataset item by project annotators. This allows for easy identification of potential issues or bottlenecks in the annotation process. The x-axis brush allows navigation and zooming on dataset items. Zooming in will reveal the dataset item id which can be used in the [annotation search](../annotation-view).

<figure style={{textAlign: "center"}}>
  <img
  src={require('../../../../static/img/interface/dashboard/dashboard_overview_flag_plot_v1.png').default}
  alt="QuickGraph Dashboard Overview - Flag Plot"
  style={{height:"100%"}}
  />
  <figcaption>Figure 6: Project dashboard overview - Flag plot.</figcaption>
</figure>

### Distribution of Comments Made on Dataset Items

A bar chart that displays the distribution of comments made by annotators on dataset items, which can help identify areas where annotators require further clarification or guidance. The x-axis brush allows navigation and zooming on dataset items. Zooming in will reveal the dataset item id which can be used in the [annotation search](../annotation-view).

<figure style={{textAlign: "center"}}>
  <img
  src={require('../../../../static/img/interface/dashboard/dashboard_overview_social_plot_v1.png').default}
  alt="QuickGraph Dashboard Overview - Social Plot"
  style={{height:"100%"}}
  />
  <figcaption>Figure 7: Project dashboard overview - Social plot.</figcaption>
</figure>

<!-- - Shows the top 10 triple types annotated in `(s, o, r)` format where s - subject (_source_), o - object (_target_), r - relation. For weak triples (a result of relation propagation) a prefix of `W` will be shown to distinguish it from silver triples. This is an aggregation across all annotators. -->

:::caution
Note that if the project task is `entity annotation only`, the Distribution of Applied Relations (Silver and Weak Quality) will **not** be displayed.
:::
