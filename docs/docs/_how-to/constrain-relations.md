# Constrain Relations

For projects that involve relation annotation, **relation constraints** can be applied. Relation constraints are used to restrict the domain/range of triples that can be annotated.

For example, given the entity types `PER, ORG, LOC` and relation types `WorksAt`, `LocatedAt`. Constraints can be applied between entities `PER,ORG` to only permit `WorksAt` relations, similarly `ORG,LOC` with `LocatedAt`. For projects with large entity and relation classes, this can reduce the effort required by annotators when searching for suitable relations, moreover it can reduce errors, and improve annotation consistency and speed by limiting applicable relations.

Relation constraints can be updated in the dashboard by navigating to the [Ontologies](/interface/dashboard/ontologies) tab.
