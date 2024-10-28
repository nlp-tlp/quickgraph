---
title: Details
keywords:
  - quickgraph
  - project
  - creation
  - details
sidebar_position: 1
---

# Project Details

The first step of project creation is specifying **project details** (Figure 1). This is where you can set up and customise the configuration and annotation controls of your project. When creating a project, you will be assigned as the **project manager**, giving you exclusive access to all the project's settings, resources, and datasets.

<figure style={{textAlign: "center"}}>
  <img
  src={require('../../../../static/img/interface/projects/project_creator_details_v1.png').default}
  alt="QuickGraph Projects Explorer"
  style={{height:"100%", border: "1px solid lightgrey"}}
  />
  <figcaption>Figure 1: Overview of project details view.</figcaption>
</figure>

The components of the project details include:

- **Name**: Easily identify and distinguish your project and describe it to potential collaborators. Clicking the dice icon will randomly generate a project name.
- **Description**: Provide an optional description to give more context about your project.
- **Task configuration**: Choose between entity annotation only or entity and closed relation annotation to set the type of task for your project.
- **Annotation Propagation**: Toggle annotation propagation on or off for annotators. This setting can be updated in the project dashboard.
- **Discussions**: Toggle annotators from having discussions on dataset items. This setting can also be updated in the project dashboard. Disabling this means annotators will not see each others comments, however they can post their own.

:::info
The ability to add relation annotation tasks to entity-only projects is currently on the [Planned Features](../../../planned-features) road-map.
:::

<!-- currently limited to annotation propagation controls (if it is intended to have multiple annotators). See [project settings](/interface/dashboard/settings) for details on why you may want to disable propagation. -->
