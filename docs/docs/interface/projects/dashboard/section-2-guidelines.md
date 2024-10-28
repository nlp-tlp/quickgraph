---
title: Guidelines
keywords:
  - quickgraph
  - project
  - dashboard
  - knowledge graph
sidebar_position: 2
---

# Annotation Guidelines

QuickGraph provides a dynamic **Annotation Guidelines** (Figure 1) feature designed to enhance collaboration among annotators. This feature enables annotators to share insights, document challenging examples, and outline the annotation procedures they employ within their dataset. The guidelines are readily accessible to all annotators via the [project annotation view](../annotation-view). As it stands, the project manager is responsible for overseeing the completion, updates, and additions to the guidelines, ensuring a smooth and efficient annotation process.

<figure style={{textAlign: "center"}}>
  <img
  src={require('../../../../static/img/interface/dashboard/dashboard_guidelines_v1.png').default}
  alt="QuickGraph Dashboard Guidelines"
  style={{height:"100%", border: "1px solid lightgrey"}}
  />
  <figcaption>Figure 1: Project dashboard - Guidelines.</figcaption>
</figure>

The benefits of using annotation guidelines include:

1. **Consistency**: Clear guidelines help maintain consistent annotations across the team, leading to higher quality data for training machine learning and NLP models.
2. **Efficiency**: Well-defined guidelines streamline the annotation process, enabling annotators to work faster and more effectively.
3. **Collaboration**: Guidelines facilitate the sharing of knowledge and best practices, fostering a collaborative environment among annotators.
4. **Clarity**: Annotation guidelines provide a reference point for annotators when they encounter ambiguous or complex examples, reducing potential confusion.
5. **Training**: Guidelines serve as an excellent resource for onboarding new annotators, ensuring they quickly understand the project's requirements and expectations.
6. **Reduced Discrepancies**: Comprehensive guidelines help minimise disagreements and discrepancies among annotators, leading to a more unified dataset.
7. **Continuous Improvement**: The dynamic nature of the guidelines allows for ongoing updates and refinements, ensuring they remain relevant and useful throughout the project lifecycle.

## Modifying Project Guidelines

Project guidelines are articulated utilising [Markdown](https://www.markdownguide.org/), a widely-used markup language due to its simplicity and versatility. To amend or introduce new guidelines for the project, follow the steps below (demonstrated in Figure 2):

1. **Access the Editor**: This is where you will input your Markdown content. If you're updating existing guidelines, you can edit the content already present in the editor.
2. **Review your changes**: Markdown content will be dynamically rendered in the **Preview** section. This preview simulates the view that project annotators will see, providing a realistic representation of your changes.
3. **Save your changes**: Once you are satisfied with your additions or modifications, click on the `Update` button to confirm and save your changes. This will also update the associated timestamp, which provides a record of the last time the guidelines were updated.

<figure style={{textAlign: "center"}}>
  <img
  src={require('../../../../static/img/interface/dashboard/dashboard_guidelines_v1.gif').default}
  alt="QuickGraph Dashboard Guidelines"
  style={{height:"100%", border: "1px solid lightgrey"}}
  />
  <figcaption>Figure 2: Demonstration of adding project guidelines and accessing them from the annotation view.</figcaption>
</figure>

Remember, the Markdown syntax allows you to format text, create lists, add links, and more. You can refer to the [Markdown Guide](https://www.markdownguide.org/) for more information about the syntax and its capabilities.

Feel free to experiment until your guidelines capture exactly what you want to communicate to your project annotators.
