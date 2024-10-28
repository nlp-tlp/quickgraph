---
sidebar_position: 3
---

# Projects

This section offers an overview of the fundamental elements that make up QuickGraph projects. Projects form the backbone of QuickGraph, and they are built upon a foundation of [resources](./resources) and [datasets](./datasets). Projects in QuickGraph are specifically designed to be unique and separate entities, allowing for greater customization and adaptability to suit a wide range of use cases and requirements. Each project combines various components, such as datasets, ontology resources, annotators, and settings, to create an efficient and effective environment for entity and relation annotation tasks. Through the careful management and configuration of these components, QuickGraph projects can be tailored to address the needs of different teams and objectives, ensuring high-quality annotation results and streamlined workflows.

:::info
For a comprehensive guide on the QuickGraph project dashboard user interface, which covers all its features and functionalities, please [click here](../category/dashboard)
:::

## Dataset

A dataset is a crucial and required component of any project, as it provides the textual data that annotators will engage with during the annotation process. There are different types of datasets available, such as standard, rich, or preannotated, each designed to cater to specific needs and scenarios. By linking a dataset to a project, you empower annotators to carry out a variety of tasks, including entity and relation annotation.

When a dataset is associated with a project, it is referred to as a "project dataset." While project datasets share the same features and functionalities as their reusable counterparts, known as "blueprint datasets," they are considered distinct entities. This distinction allows for greater flexibility and adaptability within the project framework.

## Ontology Resources

Ontology resources consist of the set of labels and categories that annotators can apply while working on a project. Depending on the project's task configuration, these resources may include entity and/or relation ontologies, which provide the essential structure for consistent and accurate annotation. By connecting ontology resources to a project, you can ensure that annotators follow guidelines and maintain consistency throughout the annotation process.

When an ontology resource is linked to a project, it is referred to as a "project resource." Though project resources have the same features and functionalities as their reusable counterparts, known as "blueprint resources," they are treated as separate entities. This distinction allows for increased flexibility and adaptability within the project framework.

## Annotators

Annotators are the individuals responsible for performing text annotations within a project. They are essential contributors in creating high-quality annotations, which are critical for training machine learning models or executing other NLP tasks. Effective management of annotators helps ensure smooth project progression and consistent dataset annotation.

There are two roles that annotators can assume within a project: the `project manager` and the `annotator`. These roles define the level of responsibility and authority an annotator holds within the project. Annotators can be in one of three states within a project: `invited`, `accepted`, or `declined`. These states help to keep track of the annotators' involvement in the project and assist in organizing the team efficiently.

## Guidelines

Guidelines serve as live documentation designed to support annotators throughout the annotation process. They play a crucial role in facilitating collaboration and improving consistency among annotators. By providing clear instructions, examples, and best practices, guidelines help annotators better understand the project's objectives and the annotation rules they should follow.

Moreover, guidelines offer a platform for annotators to report difficulties they encounter while annotating, fostering communication and collaboration between team members. This interactive aspect of guidelines ensures that any challenges or ambiguities are addressed promptly, resulting in higher-quality annotations and more efficient workflows.

Incorporating guidelines into a project not only enhances the annotators' understanding of the task at hand but also promotes teamwork and ensures the highest level of consistency and accuracy in the final annotations.

## Settings

Settings are the configurable options that determine the behavior and appearance of a project. They include options related to annotation tools, user interface, and project-specific features. By customizing settings, you can tailor a project to suit the needs and preferences of annotators and project managers, improving the overall efficiency and user experience. Configurable settings include toggling annotator discussions and modifying the number of minimum annotators per dataset item.
