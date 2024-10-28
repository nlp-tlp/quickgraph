---
title: Annotations
sidebar_position: 4
---

# Overview

In QuickGraph, annotations are categorised into three distinct types: Suggested, Accepted and Agreed Upon. Each annotation type has unique chracteristics and implications. The table below provides a succinct summary of these categories:

| Annotation Type    | Description                                                                                                                                                                                                                                                                                                                                                                                                               |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Suggested (Weak)   | These annotations have not been verified by an annotator and often result from dataset preannotation or annotation propagation events. In the [Annotation View](../interface/projects/annotation-view), they appear as semi-opaque entities labels (see Figure 1). The [Knowledge Graph](../interface/projects/dashboard/section-3-knowledge-graph.md) displays them as semi-opaque squares.                              |
| Accepted (Silver)  | These annotations have been verified by an annotator, either through manual application, by accepting a suggestion, or specified in a preannotated dataset (see Figure 1). In the [Annotation View](../interface/projects/annotation-view), they appear as fully coloured entities labels. The [Knowledge Graph](../interface/projects/dashboard/section-3-knowledge-graph.md) represents them as fully coloured circles. |
| Agreed Upon (Gold) | These annotations represent consensus, achieving majority agreement amongst annotators. For single annotator projects, they are identical to silver annotations. They are prominently featured in the [Knowledge Graph](../interface/projects/dashboard/section-3-knowledge-graph) and [Downloads](../interface/projects/dashboard/section-6-downloads). They are typically used to train machine learning models.        |

This tripartite annotation system enhances the quality control process, allows for an iterative and progressive validation of annotations, and facilitates a smoother collaboration among annotators.
