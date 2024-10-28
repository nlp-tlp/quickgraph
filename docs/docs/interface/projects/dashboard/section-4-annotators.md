---
title: Annotators
keywords:
  - quickgraph
  - project
  - dashboard
  - annotators
sidebar_position: 4
---

# Annotators

:::danger
This page is currently only visible for project managers in the application.
:::

The **Annotators** page (Figure 1) is where project annotators are managed. Outlined below are how annotators are invited to projects, their roles and states, and how they are managed over the lifecycle of a project. Please note that the following content is written for project managers.

<figure style={{textAlign: "center"}}>
  <img
  src={require('../../../../static/img/interface/dashboard/dashboard_annotators_v1.png').default}
  alt="QuickGraph Dashboard Annotators"
  style={{height:"100%", border: "1px solid lightgrey"}}
  />
  <figcaption>Figure 1: Project dashboard annotators.</figcaption>
</figure>

:::info
The annotator tab, `Annotators (n)`, only shows the number of accepted annotators.
:::

## Project Annotator Table

The **Project Annotator Table** (Figure 1) provides a concise summary of all the annotators participating in your project. The table comprises the following columns: `Number`, `Username`, `Role`, `State`, `Scope Size` and `Actions`.

### Understanding Annotator States and Roles

QuickGraph distinguishes three states for annotators - Invited, Accepted, and Declined - and allocates them into one of two roles - Project Manager and Annotator. The table below provides a summary of these states and roles:

| Annotator States/Roles | Description                                                                                                                                                                                                                                             |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **States**             |                                                                                                                                                                                                                                                         |
| Invited                | An annotator with this state has received an invitation to the project but hasn't yet responded. The invitation will appear in their notification bell.                                                                                                 |
| Accepted               | An annotator in the Accepted state has confirmed their participation in the project and is ready to work on assigned documents.                                                                                                                         |
| Declined               | An annotator in the Declined state has opted out of the project by declining the invitation.                                                                                                                                                            |
| **Roles**              |                                                                                                                                                                                                                                                         |
| Project Manager        | This role holds the highest authority within a QuickGraph project. They have full access to all tabs in the project dashboard, including the project settings.                                                                                          |
| Annotator              | An Annotator has limited access to certain tabs in the project dashboard, such as the [Annotators](./section-4-annotators.md), [Resources](./section-9-resources.md), [Dataset](./section-7-dataset.md), and [Settings](./section-10-settings.md) tabs. |

### Actions Available for Managing Annotators

Project Managers have three primary controls over annotators:

**Dataset item assignment**

By default, newly invited annotators aren't assigned any dataset items. This control allows you to manage document assignment as needed.

**User disabling**

You can use this control to temporarily bar users from accessing your project without fully removing them.

:::info
This feature is currently disabled.
:::

**User removal**

This feature allows you to permanently remove users from your project. Please note that this action is irreversible.

## Inviting Annotators to the Project

To invite annotators to your project, simply enter their usernames, separated by commas, in the provided text field and click `Add`. If you're uncertain of a collaborator's username, you'll need to contact them directly. Valid usernames will receive an invitation to join your project, and users will be notified about your invitation. They have the option to accept or decline this invite. The status of users who have been invited but haven't responded will be displayed as `invited`.

:::caution
Please note that annotators who accept an invitation are not automatically assigned any dataset items. As a project manager, you'll need to assign these items to them. If you are an annotator, please contact the project manager to assign dataset items to you.
:::

## Assigning Dataset Items (Documents)

Upon joining a project, annotators aren't assigned any dataset items by default. To assign items to newly added annotators or modify existing assignments, locate the assignment icon in the project annotators table and click on it. This action triggers an assignment modal (see Figure 2).

In this modal, select the dataset items you want to assign to an annotator by checking the corresponding boxes. If you wish to assign all items, use the checkbox in the header. Once you've made your selection, click `Update Assignment` to finalise the assignment process.

<figure style={{textAlign: "center"}}>
  <img
  src={require('../../../../static/img/interface/dashboard/dashboard_annotators_assignment_v1.png').default}
  alt="QuickGraph Dashboard Annotators Dataset Item Assignment"
  style={{height:"100%", border: "1px solid lightgrey"}}
  />
  <figcaption>Figure 2: Project dashboard annotators - dataset item assignment.</figcaption>
</figure>

:::caution
Assigning dataset items that carry extensive preannotations might require a few minutes to process. We appreciate your patience during this time.
:::

## Removing Annotators from the Project

Annotators can be removed from your project at any time. To do so, click the red trash can icon in the project annotator table, which will open an annotator removal modal (Figure 3). Enter the username of the annotator you wish to remove and click `Remove`.

By default, removing an annotator will also delete all annotations they've made. If you prefer to retain these annotations, ensure the provided checkbox is toggled on before confirming the removal.

<figure style={{textAlign: "center"}}>
  <img
  src={require('../../../../static/img/interface/dashboard/dashboard_annotators_annotator_remove_v1.png').default}
  alt="QuickGraph Dashboard Annotators Annotator Removal"
  style={{height:"100%", border: "1px solid lightgrey"}}
  />
  <figcaption>Figure 2: Project dashboard annotators - annotator removal.</figcaption>
</figure>
