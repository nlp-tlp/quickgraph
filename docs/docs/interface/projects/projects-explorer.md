---
title: Projects Explorer
description: Projects Explorer - Centralised hub for managing projects.
keywords:
  - quickgraph
  - projects
  - project
  - explorer
  - management
sidebar_position: 1
---

# Projects Explorer

The **Projects Explorer** page (Figure 1) on QuickGraph is a centralised hub for managing all your annotation projects. It displays every project you've created or joined through accepted invitations. If you have no active projects, the page will prompt you to create a new one.

<figure style={{textAlign: "center"}}>
  <img
  src={require('../../../static/img/interface/projects/projects_explorer_v1.png').default}
  alt="QuickGraph Projects Explorer"
  style={{height:"100%", border: "1px solid lightgrey"}}
  />
  <figcaption>Figure 1: Overview of projects explorer view.</figcaption>
</figure>

## Project Card

The **Project Card** (Figure 2) offers a comprehensive overview of each project, showcasing essential information:

<figure style={{textAlign: "center"}}>
  <img
  src={require('../../../static/img/interface/projects/projects_explorer_project_card_v1.png').default}
  alt="QuickGraph Projects Explorer"
  style={{height:"300px"}}
  />
  <figcaption>Figure 2: Example of project card.</figcaption>
</figure>

- **Project number**
- **Project title**
- **Progress made**, visualised by a linear progress bar that represents the ratio of documents with the minimum number of annotators to the total assigned documents
- **Project completion status**, marked as either `Completed` or `In Progress`
- **Your status on the project**, marked as either `Project Manager` or `Annotator`
- **Project task configuration**, specifying whether it involves `entity annotation only` or both `entity and closed relation annotation`
- **Project last updated date**
- **Avatars of active annotators**, displaying only those who have accepted invitations

Additionally, each card features quick links to `Annotate` and the project's `Dashboard`, allowing for seamless navigation and management.

## Filters and Sorting

<figure style={{textAlign: "center"}}>
  <img
  src={require('../../../static/img/interface/projects/projects_explorer_filter_sort_v1.png').default}
  alt="QuickGraph Projects Explorer"
  style={{height:"100%"}}
  />
  <figcaption>Figure 3: Project explorer filter and sorting.</figcaption>
</figure>

The Projects Page offers several filters and sorting options (Figure 3) to streamline your navigation experience:

### Filtering Options

- **Free text search**: Quickly locate specific projects by inputting relevant keywords or phrases that match project titles or descriptions.
- **Annotation Task(s) filter**: Refine the project list based on their associated annotation tasks (`All Tasks`, `Entity Only`, `Entity and Relation`).
- **Project Manager**: Filter projects according to your involvement as a project manager (`Everything`, `True`, `False`).
- **Created By**: Find projects by filtering for the creator's username, which is particularly helpful for identifying projects you're a part of.

### Sorting Options

- **Last updated date**: Organise your projects based on the latest modifications, keeping you informed about ongoing progress (`Oldest First`, `Newest First`).
- **Active annotators**: Arrange projects by the quantity of active annotators involved (`Fewest First`, `Most First`).
- **Percentage complete**: Order projects according to the proportion of annotated items (saved items divided by total items) (`Lowest First`, `Highest First`).
- **Created By**: Sort projects based on the creator's username for easier identification (`A-Z`, `Z-A`).

## Creating New Projects

You can easily create new projects by clicking the `Create New Project` card. This action initiates the [project creation process](/category/project-creator), guiding you through the necessary steps to set up and configure your new annotation project.
