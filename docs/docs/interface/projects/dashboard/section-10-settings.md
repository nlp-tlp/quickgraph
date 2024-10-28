---
sidebar_position: 10
---

# Project Settings

The **Project Settings** page (Figure 1), **accessible only to project managers**, serves as a hub for adjusting project-specific parameters. Here, you can perform the following tasks:

- Update the project name and description.
- Enable or disable annotation propagation and dataset item discussions.
- Specify the minimum number of annotators per dataset item.
- Download the entire project data.
- Permanently delete the project.

<figure style={{textAlign: "center"}}>
  <img
  src={require('../../../../static/img/interface/dashboard/dashboard_settings_v1.png').default}
  alt="QuickGraph Dashboard Settings"
  style={{height:"100%", border: "1px solid lightgrey"}}
  />
  <figcaption>Figure 1: Project dashboard settings.</figcaption>
</figure>

## Annotation Propagation Control

The **annotation propagation** setting allows you to control how annotations are applied across your project. By toggling this setting `on`, project annotators will be able to apply annotations to the entire corpus. Conversely, toggling this setting `off` restricts annotations to individual applications. It may be beneficial to disable propagation for new or learning annotators to minimize potential annotation errors.

## Dataset Item Discussions

The **dataset item discussions** setting determines whether annotators can view each other's comments on dataset items. When toggled `on`, annotators can see and engage in collaborative discussions. Toggling this setting `off` ensures annotators' comments remain private. Regardless of the setting, annotators can always comment, but this setting manages the visibility across the team.

## Minimum Annotators

The **minimum annotators per dataset item** setting can be adjusted to any value from `1` to the total number of active project annotators. This value impacts project metrics such as overall progress and agreement measures, as these metrics depend on the minimum number of save states made by annotators.

## Project Download

The entire project, including metadata, resources, annotators, annotations, dataset, socials, and more, can be downloaded as a JSON file by clicking the `Download` button. An example of the file is shown below:

```json
{
  "project": {...},
  "dataset": {...},
  "dataset_items": [{...}, ...],
  "markup": [{...}, ...],
  "social": [...]
}
```

## Project Deletion

While projects can be deleted at any time using the available option, be aware that deletion is permanent and irreversible. **Please exercise caution when considering this action**.
