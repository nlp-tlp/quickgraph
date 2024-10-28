# Create a dataset

Datasets are at the heart of QuickGraph. To support various levels of annotation projects, QuickGraph supports two core datasets: standard and annotated. Before we get into creating a dataset, let's first understand the differences between these two dataset types.

## Standard Datasets

At the most basic, standard datasets are composed of dataset items that are strings text content. A dataset item can be a word, sentence, paragraph or document. However, QuickGraph splits dataset items by newline characters in the standard dataset format. For example,

```plaintext
Lorem ipsum dolor sit amet, consectetur adipiscing elit.
Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vestibulum id pellentesque mi. Phasellus sollicitudin arcu aliquet, laoreet eros a, accumsan sem. Nulla in lectus laoreet, auctor metus eget, consectetur velit. Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos. Donec ac quam a est porta sollicitudin. Fusce fermentum metus a diam volutpat cursus at malesuada magna. Nulla gravida quis tellus sed elementum. Nunc vel metus finibus, fringilla elit sit amet, rhoncus tortor. Vivamus viverra velit at sodales auctor.
```

### Creating a standard dataset

Navigate to `/datasets` and click on "create new dataset". Enter the name of the dataset and an optional description. Click "next" to go to QuickGraph's dataset editor. Here, you can either paste in newline separated text content or click "upload" and select a pre-existing text file (.txt).

### Creating a standard dataset with external ids and extra fields

If you want to keep track of external information associated with your QuickGraph dataset, for example external identifiers and fortituous information, you can upload a "rich" dataset by clicking on the "JSON" dropdown or uploading a JSON file (.json). QuickGraph will help you by validating the content you enter into the editor. The format of "rich" datasets is:

```json
[
	{
		"original": "string",
	 	"tokens": ["string"],
	 	"external_id": "string",
	 	"extra_fields": {}
	},
	...
]
```

Here `original` is the text content of the dataset item before it is tokenized, `tokens` is an array of the resulting tokens of the tokenized "original" text, `external_id` is a string identifier, and `extra_fields` can contain any key/value fields of fortuitous data.

## Annotated Datasets

### Entity Annotated

### Entity and Relation Annotated
