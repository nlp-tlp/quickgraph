---
sidebar_position: 1
---
# Convert Data Format from Mention-level to CoNLL03

In this guide, we'll see how the output of QuickGraph can be easily converted into CoNLL03 BIO format for named entity recogition.

## Overview

Depending on the algorithm used for named entity recognition (NER), the format for input data can vary. The most common data format for NER was proposed at CoNLL03:

```
Barack	B-PER
Obama	I-PER
is
the
president
of
the
USA		B-LOC
```

QuickGraph uses a format called `mention-level` which is a compact JSON format that assigns entity tags based on their token position (white space tokenized). Using the example above, the mention-level format is:

```
{
	"tokens": ["Barack", "Obama", "is", "the", "president", "of", "the", "USA"],
	"mentions": [{"start": 0, "end": 1, "labels": ["PER"]}, {"start": 7, "end": 7, "labels": ["LOC"]}]
}
```

So how do we convert this mention-level output to CoNLL03 format as expected by numerous popular frameworks that support NER such as Flair/HuggingFace/FairSeq?

## Converting mention-level annotaton to CoNLL03

Below is a Python script that converts mention-level annotations to CoNLL03 format.

```
Insert python script here.
```

This script can be used to convert QuickGraph outputs into those expected by other programs :).
