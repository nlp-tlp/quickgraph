---
title: Downloads
keywords:
  - quickgraph
  - project
  - dashboard
  - downloads
sidebar_position: 6
---

# Downloads

The **Downloads** tab provides a seamless gateway to access annotations contributed by project annotators. It offers a straightforward snapshot of the entities and triples formed, allowing you to easily manage and assess the project's progress. Annotations can be efficiently filtered based on their save states and quality.

<figure style={{textAlign: "center"}}>
  <img
  src={require('../../../../static/img/interface/dashboard/dashboard_download_v1.png').default}
  alt="QuickGraph Dashboard Downloads"
  style={{height:"100%"}}
  />
  <figcaption>Figure 1: Project dashboard downloads.</figcaption>
</figure>

## Filters

The Downloads interface incorporates two filters to aid you in curating the most relevant data: Save State and Quality-based filtering.

1. **Save State**: This filter lets you retrieve dataset items according to their save state. You can choose among `Unsaved`, `Saved`, or `Everything` (default).
2. **Quality**: This filter allows you to sift through annotations based on their quality. You can select from `Suggested` (weak), `Accepted` (silver), or `Everything` (default).

:::info
We're excited to announce that the automatic construction of a gold-standard corpus is on our roadmap. To learn more, visit our [Planned Features](../../../planned-features) section.
:::

## Downloading Data

After setting your desired filters, simply select the checkboxes next to the annotators whose annotations you wish to download. Once you've selected at least one annotator, click `Download Annotations`. This action prompts the annotations to be downloaded in JSON format. Below is a glimpse of the output download structure for an example project. For more details, refer to the [Concepts - Datasets](../../../concepts/datasets) section.

```json
{
  "username": [
    {
      "id": "133e5ed5db00edb2c49c4d29",
      "original": "<id> - <id> <id> chord thickness UT",
      "text": "<id> - <id> <id> chord thickness UT",
      "tokens": ["<id>", "-", "<id>", "<id>", "chord", "thickness", "UT"],
      "extra_fields": null,
      "external_id": "6",
      "saved": true,
      "entities": [
        {
          "id": "133e6ad90349032bc70dc98c",
          "start": 5,
          "end": 6,
          "label": "Activity/MaintenanceActivity/Diagnose"
        },
        {
          "id": "133e6add0349032bc70dcbd4",
          "start": 4,
          "end": 4,
          "label": "PhysicalObject/HoldingObject/StructuralSupportingObject"
        },
        {
          "id": "133332e32e3ea8d3145ea392",
          "start": 6,
          "end": 6,
          "label": "Activity/MaintenanceActivity/Diagnose"
        }
      ],
      "relations": [
        {
          "id": "133f70a30349032bc7b9b9b2",
          "source_id": "133e6ad90349032bc70dc98c",
          "target_id": "133e6add0349032bc70dcbd4",
          "label": "hasParticipant/hasPatient"
        },
        {
          "id": "133333202e3ea8d3145eccad",
          "source_id": "133e6ad90349032bc70dc98c",
          "target_id": "133332e32e3ea8d3145ea392",
          "label": "isA"
        }
      ],
      "flags": []
    }
  ]
}
```
