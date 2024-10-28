---
title: Preprocessing
sidebar_position: 3
---

# Dataset preprocessing

For standard datasets, e.g. those that are new line separated texts, QuickGraph can perform typical NLP preprocessing steps without the need of third party sofware or programming environments. Note: _preprocessing is only available for datasets pasted into the dataset editor or uploaded as a newline separated text file_. The following operations are available for this dataset type:

## Case removal (lower casing)

This operation completely removes casing from the dataset via lowering e.g. `Barack Obama is the president` will be transformed into `barack obama is the president`.

**Pros**

- When combined with duplicate removal and other operations, can remove redudant information from your dataset leading to more efficient annotation.
- Improves the effectiveness of annotation propagation as this is impacted by character case.

**Cons**

- May impact downstream algorithmic performance due to removal of proper nouns, acronyms, and domain-specific terminology.

## Duplicate removal

As mentioned above, after preprocessing is applied to a given dataset, there may be dataset items that have identical contents. The duplicate removal operation removes these from the dataset to improve annotator efficiency. Consider a dataset with two items:

```
replace engine oil
REPLACE ENGINE OIL

```

After performing case removal, this will result in:

```
replace engine oil
replace engine oil
```

Hence, removing duplicates is desirable as 50% of the effort would be reduced on redudant annotation.
