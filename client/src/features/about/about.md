# About QuickGraph

QuickGraph is a collaborative annotation tool for rapid multi-task information extraction.

## Project Feed

![image-20220514190955828](/home/tyler/.config/Typora/typora-user-images/image-20220514190955828.png)

This page (above) shows all the projects you have created (and manage) as well as projects you are a part of. Each card in the feed shows the projects - creation date, name, description, number of documents annotated by the group (or yourself if single user annotation), number of active annotators, and task configuration.

## Project Creation

Clicking on `new project` will take you to QuickGraph's project creation page.

### Details

![image-20220514191552610](/home/tyler/.config/Typora/typora-user-images/image-20220514191552610.png)

The details page is where the projects `name`,`description`, `task type` and `clustering` options are specified. Each project is distinguished by its name and description. Currently, QuickGraph the following tasks:

- Entity annotation
- Entity and open relation annotation
- Entity and closed relation annotation

To aid with annotation efficiency, QuickGraph allows projects to have their documents clustered by embedding documents and clustering them using agglomerative clustering via Sentence-BERT [].

### Corpus Upload

![image-20220514191630005](/home/tyler/.config/Typora/typora-user-images/image-20220514191630005.png)

Uploading a corpus to the new project is possible by either loading a text file or pasting in a set of new line separated texts. After either action, the number of texts in the corpus will be presented.

### Corpus Preprocessing

![image-20220515075608127](/home/tyler/.config/Typora/typora-user-images/image-20220515075608127.png)

To improve annotation efficiency, QuickGraph allows uploaded corpora to be lightly preprocessed. The preprocessing actions include:

- Removing casing,
- Removing characters, and
- Removing duplicate texts

If any of these actions are selected, the impacts on the corpus will be shown via:

- Corpus size reduction,
- Vocabulary size reduction, and
- Overall number of token removed

The preprocessing steps are irreversible and will be displayed on the projects dashboard. 

### Project Ontology/Schema

![image-20220515075908645](/home/tyler/.config/Typora/typora-user-images/image-20220515075908645.png)

Depending on the multi-task configuration selected at the `details` step, an ontology/schema must be specified for entities and relations (if applicable). Shown above is the view for entities. Here, a custom hierarchical entity ontology can be built consiting of an arbitrary number of classes with arbitrary depth. Alternatively, preset ontologies also exist for entity classification including: CoNLL03, SemEval-07 Task 4, SemEval-10 Task 8, and FIGER. **Warning: Selecting any of these will override any custom ontology created.**

![image-20220515080433795](/home/tyler/.config/Typora/typora-user-images/image-20220515080433795.png)

Similarly, for tasks consisting of relation annotation, a custom ontology can be created with an arbitrary number of relations and depth. Preset ontologies are also included and include:  ConceptNet-5, Coreference, SemEval-07 Task 4, and SemEval-10 Task 8. **Warning: Selecting any of these will override any custom ontology created.**

#### Relation Constraints

![image-20220515080705364](/home/tyler/.config/Typora/typora-user-images/image-20220515080705364.png)

A novel feature of QuickGraph is the ability to apply relation constraints onto relations in the relation ontology by pressing **[BUTTON]**. This feature allows the domain and range of relations to be specified by selecting entities from the entity ontology. For example, show above is the domain and range specified for the relation `AtLocation` - here, the domain is `Organisation` and `Person` and `Location` is the range. By specifying this, annotators will only be able to apply relations from `Organization` and `Person` to `Location`. Triples such as `(Miscellaneous, AtLocation, Organization)` will not be possible. For large relation ontologies, this enhances the speed of relation annotation by reducing time and cognitive load searching for applicable relations between entities.

### Corpus Pre-annotation

![image-20220515081000778](/home/tyler/.config/Typora/typora-user-images/image-20220515081000778.png)

To aid annotation, QuickGraph allows projects to be preannotated using predefined resources. Currently, QuickGraph allows *entity preannotation* and *typed triple preannotation*.

#### Entity Preannotation

Entity preannotation requires the resource to be formatted as a text file consisting of lines with `token span,entity class`. For example:

```
Barack Obama,person/president
Michelle Obama,person 
```

When the project is created, the specified tokens will have the entity classes applied as `suggestions` that the annotator must accept.

#### Typed Triple Preannotation

Typed triple preannotation requires the resource to be formatted as a text file consisting of lines with `source span, source type, relation type, target span, target type, offset`. Here the often is the number of tokens separating the source and target. This is implemented to reduce the over application of triples. An example resource looks like:

```
Barack Obama,person/president,marriedTo,Michelle Obama,person,3
```

This would match on the sentence `Barack Obama is married to Michelle Obama` where `is married to` consists of 3 tokens that offset the source and target spans.

### Project Review and Creation

![image-20220515082342623](/home/tyler/.config/Typora/typora-user-images/image-20220515082342623.png)

At the end of the project creation process, an overview of the steps performed is presented. At any stage, the step can be modified by clicking the `back` button. If the project is created satisfactorily, clicking `create` will create the project. Note that for large projects (thousands of documents) or projects with clustering, this process may take a few minutes. 

*Note: additional annotators can be invited to the project after project creation from the project dashboard.*

## Annotation

## Project Dashboard



## User Profile







# FAQ





