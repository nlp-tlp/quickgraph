---
title: Review
keywords:
  - quickgraph
  - project
  - creation
  - review
sidebar_position: 6
---

# Review

The final step before launching your project involves reviewing the progress made in each stage. The **review** step offers a summary of the details you've entered throughout the process. Each stage is represented by a summary card, displaying the current status of that stage.

<figure style={{textAlign: "center"}}>
  <img
  src={require('../../../../static/img/interface/projects/project_creator_review_v1.png').default}
  alt="QuickGraph Projects Explorer"
  style={{height:"100%", border: "1px solid lightgrey"}}
  />
  <figcaption>Figure 1: Overview of project review stage.</figcaption>
</figure>

The cards will be either green - signifying valid information, or red - indicating that the stage requires attention (Figure 2). On the right-hand side of the cards, you'll find a `Review` button for successful stages or a `Fix` button for those needing attention. Clicking these buttons will navigate you to the respective step. If all stages are marked green, you can create your project by clicking the `Create` button.

<figure style={{textAlign: "center"}}>
  <img
  src={require('../../../../static/img/interface/projects/project_creator_review_fix_example_v1.png').default}
  alt="QuickGraph Projects Explorer"
  style={{height:"100%"}}
  />
  <figcaption>Figure 2: Example of successful and unsuccessful (no entity ontology selected) project creation stages.</figcaption>
</figure>

:::caution
If the selected dataset, ontologies, or preannotation resources are large, the project creation process may take some time. We appreciate your patience.
:::
