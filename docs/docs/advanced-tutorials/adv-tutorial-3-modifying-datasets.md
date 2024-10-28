---
title: Modifying an existing dataset
description: Learn how to modify an existing dataset including adding and removing items.
sidebar_position: 3
---

# Overview

:::warning
Please note only project managers and dataset creators can modify datasets.
:::

In this tutorial, you'll learn how to append or delete items from QuickGraph datasets. For illustrative purposes, we'll modify the dataset associated with the "Alice In Wonderland" project (created in the [Introduction Tutorial](../tutorial/step-1-create-a-project#creating-a-dataset)). However, this process is identical for [blueprint datasets](../concepts/datasets).

As your project evolves, you might need to add more data or delete unsuitable data. The instructions below will guide you through modifying a project dataset.

## Finding the Dataset

**Step 1:** Navigate to the "Alice In Wonderland" [Dataset Management page](../interface/datasets/dataset-management) (Figure 1). You can either:

**Option A:** Click on the `Dataset` tab in the [Project Dashboard](/category/dashboard). This will open a new window displaying the project dataset. Look for a chip that says `Project`.

**Option B:** Locate the project dataset from the [Dataset Explorer](../interface/datasets/datasets-explorer) page.

Either way, you will land on the [Dataset Management page](../interface/datasets/dataset-management). Here, you can identify the associated project - Alice In Wonderland in this case.

:::info
Modifying a project dataset will only reflect changes to that dataset. Also, modifying a blueprint dataset won't affect projects already initiated with that blueprint, but future ones will incorporate these changes.
:::

On the [Dataset Information sidebar](../interface/datasets/dataset-management#dataset-information-sidebar), you can view information like preprocessing steps, linked projects, and linked resources, depending on the dataset.

<figure style={{textAlign: "center"}}>
  <img
  src={require('../../static/img/adv-tutorial/modify-dataset/dataset_original_v1.png').default}
  alt="Advanced Tutorial - Dataset Management Overview"
  style={{height:"100%", border: "1px solid lightgrey"}}
  />
  <figcaption>Figure 1: Advanced Tutorial - Dataset Management Overview.</figcaption>
</figure>

## Adding New Data Items

Let's append a new item to the dataset.

**Step 2:** Click the `Upload` button on the [Dataset Management](../interface/datasets/dataset-management).

**Step 3:** A modal identical to the [Dataset Editor](../interface/datasets/dataset-creator/step-2-editor) and [Dataset Preprocessing](../interface/datasets/dataset-creator/step-3-preprocessing) interfaces will open. Paste the following text into the modal editor:

```txt
Either the well was very deep, or she fell very slowly, for she had plenty of time as she went down to look about her and to wonder what was going to happen next. First, she tried to look down and make out what she was coming to, but it was too dark to see anything; then she looked at the sides of the well, and noticed that they were filled with cupboards and book-shelves; here and there she saw maps and pictures hung upon pegs. She took down a jar from one of the shelves as she passed; it was labelled “ORANGE MARMALADE”, but to her great disappointment it was empty: she did not like to drop the jar for fear of killing somebody underneath, so managed to put it into one of the cupboards as she fell past it.
```

Your upload modal should now resemble Figure 2.

<!-- :::tip
The chips on the top right of the upload modal indicate the type of dataset. In this case, it's a [Standard Dataset](../concepts/datasets#standard-dataset).
::: -->

**Step 4:** After copying the text into the editor, click `Add 1 Item` to append the new data item to the dataset.

Your dataset management page should now look like Figure 3.

<!-- Looking at the chips, we can see that we have uploaded one dataset item with 141 tokens. The editor in the modal has the same full functionality as the [Dataset Editor](../interface/datasets/dataset-creator/step-2-editor) including validation. Scrolling down in the modal reveals the preprocessing options (see [Dataset Preprocessing](../interface/datasets/dataset-creator/step-3-preprocessing) for more information). We'll leave these as the defaults for this tutorial. -->

<figure style={{textAlign: "center"}}>
  <img
  src={require('../../static/img/adv-tutorial/modify-dataset/dataset_upload_modal_with_text_preprocessing_v1.png').default}
  alt="Advanced Tutorial - Dataset Management Overview"
  style={{height:"100%", border: "1px solid lightgrey"}}
  />
  <figcaption>Figure 2: Advanced Tutorial - Upload Modal with One New Item.</figcaption>
</figure>

:::caution
If you are adding new dataset items to a Project Dataset, they will not automatically assigned to project annotators. You will need to navigate to the project dashboard and assign them - [see here for more information](../interface/projects/dashboard/section-4-annotators#assigning-dataset-items-documents).
:::

<figure style={{textAlign: "center"}}>
  <img
  src={require('../../static/img/adv-tutorial/modify-dataset/dataset_updated_v1.png').default}
  alt="Advanced Tutorial - Updated Dataset"
  style={{height:"100%", border: "1px solid lightgrey"}}
  />
  <figcaption>Figure 3: Advanced Tutorial - Updated Dataset.</figcaption>
</figure>

## Assigning the New Data Item

Let's assign the new dataset item to ourserves for annotation.

**Step 5:** Click on the `Alice In Wonderland` link under Linked Project in the [Dataset Information sidebar](../interface/datasets/dataset-management#dataset-information-sidebar). You will be redirected to the project's dashboard.

**Step 6:** Navigate to the [Annotators tab](../interface/projects/dashboard/section-4-annotators) on the dashboard.

**Step 7:** Click the assignment icon next to your username to assign the new data item. This will open the assignment modal (Figure 4). Select the checkbox next to the new item and click `Update Assignment` to make the item available for annotation. You'll see the assignment size increment after you do this.

**Step 8:** Navigate to the project's [Annotation View](../interface/projects/annotation-view). You should now see the new dataset item.

<figure style={{textAlign: "center"}}>
  <img
  src={require('../../static/img/adv-tutorial/modify-dataset/dataset_item_assignment_v1.png').default}
  alt="Advanced Tutorial - Annotator Assignment Modal"
  style={{height:"100%", border: "1px solid lightgrey"}}
  />
  <figcaption>Figure 4: Advanced Tutorial - Annotator Assignment Modal.</figcaption>
</figure>

## Removing Data Items

:::warning
Please note that deleting items is permanent and irreversible, leading to the removal of all associated annotations. Exercise caution while proceeding.
:::

In this section, we will guide you through the process of removing items from a dataset, as demonstrated in Figure 5.

**Step 1:** Identify the item you intend to remove from the dataset. For instance, you might want to remove the data item we added in the [previous section](#adding-new-data-items).

**Step 2:** Select the checkbox adjacent to the target item.

**Step 3:** Click on `Remove 1 Item`. This will remove the selected item from the dataset, and it will also be removed from the scope of any annotators if the dataset is linked to a project.

### Deleting All Items in a Datasets

It's essential to note that a dataset must always contain at least one item. Therefore, if you select all items, the system prevent you from removing them. Always leave at least one item unselected when performing a bulk deletion.

However, if you need to remove all items in a dataset, follow these steps:

1. Remove all items except one.
2. Upload any new items you want to include.
3. Delete the remaining old item, if it's no longer required.

This workaround allows you to essentially refresh your dataset.

<figure style={{textAlign: "center"}}>
  <img
  src={require('../../static/img/adv-tutorial/modify-dataset/dataset_delete_item_v1.gif').default}
  alt="Advanced Tutorial - Demonstration of Removing a Dataset Item."
  style={{height:"100%", border: "1px solid lightgrey"}}
  />
  <figcaption>Figure 5: Advanced Tutorial - Demonstration of Removing a Dataset Item.</figcaption>
</figure>

## Adding Items to Preannotated Datasets

:::info
Coming soon.
:::

<!-- If you are adding additional preannotated items to a preannotated dataset, the entity and relation ontology resources the original dataset were made with will be used for validation. If the dataset is a project dataset, this will be the project resources, otherwise it will be the blueprints. -->
