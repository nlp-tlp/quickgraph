import "../Graph.css";
import { useEffect, useState } from "react";
import { Button, ButtonGroup } from "react-bootstrap";
import {
  InteractionMode,
  StaticTreeDataProvider,
  Tree,
  UncontrolledTreeEnvironment,
} from "react-complex-tree";
import "react-complex-tree/lib/style.css";
import { IoSearch } from "react-icons/io5";
import { useDispatch, useSelector } from "react-redux";
import { selectProject } from "../../../project/projectSlice";
import {
  selectAggregate,
  selectGraphData,
  selectGraphGroups,
} from "../graphSlice";

export const Actions = ({ projectId, searchTerm, setSearchTerm }) => {
  const dispatch = useDispatch();
  const aggregate = useSelector(selectAggregate);
  const graphData = useSelector(selectGraphData);
  const graphGroups = useSelector(selectGraphGroups);

  const project = useSelector(selectProject);
  const [key, setKey] = useState("entities");

  const [entityData, setEntityData] = useState(
    project && project.entityOntology
  );
  const [relationData, setRelationData] = useState(
    project && project.relationOntology
  );

  // NOTE: Need to update these labels based on what is ACUTALLY on the nodes/edges not what is
  // in the ontology.
  const conceptLabels = project.entityOntology.map((label) => ({
    label: label.name,
  }));
  const relationLabels = project.relationOntology.map((label) => ({
    label: label.name,
  }));
  // console.log(conceptLabels);
  // console.log(relationLabels);

  const [filteredEntities, setFilteredEntities] = useState([]);
  const [filteredRelations, setFilteredRelations] = useState([]);

  // const onChange = (currentNode, selectedNodes) => {
  //   /*
  //     Filters entities and relations using tree-dropdown component.   
  //   */

  //   console.log(currentNode, selectedNodes);
  //   const selection = currentNode.label;

  //   if (key === "entities") {
  //     const isSelected = filteredEntities.includes(selection);
  //     // If selected, remove from array
  //     const newSelection = isSelected
  //       ? filteredEntities.filter((entity) => entity !== selection)
  //       : [...filteredEntities, selection];

  //     // If no elements in selection array, reset?
  //     const resetRequired = newSelection.length === 0;

  //     setFilteredEntities(
  //       resetRequired ? conceptLabels.map((l) => l.label) : newSelection
  //     );
  //     console.log(newSelection);
  //   } else if (key === "relations") {
  //     const isSelected = filteredRelations.includes(selection);
  //     // If selected, remove from array
  //     const newSelection = isSelected
  //       ? filteredRelations.filter((rel) => rel !== selection)
  //       : [...filteredRelations, selection];

  //     // If no elements in selection array, reset?
  //     const resetRequired = newSelection.length === 0;

  //     setFilteredRelations(
  //       resetRequired ? relationLabels.map((l) => l.label) : newSelection
  //     );
  //     console.log(newSelection);
  //   }
  // };

  // useEffect(() => {
  //   const updateGraphData = () => {
  //     const updatedData = {
  //       ...graphData,
  //       nodes: graphData.nodes.map((n) => ({
  //         ...n,
  //         hidden: filteredEntities.includes(n.class),
  //       })),
  //       edges: graphData.edges.map((e) => ({
  //         ...e,
  //         hidden: filteredRelations.includes(e.label),
  //       })),
  //     };

  //     setGraphData(updatedData);
  //   };
  //   updateGraphData();
  // }, [filteredEntities, filteredRelations]);

  // const handleSearch = () => {
  //   // Triggers graph call
  //   setShowGraph(false);
  // };

  return (
    <div id="graph-filter-container">
      <p id="graph-filter-title">Filters</p>
      <div id="graph-filter-items">
        <span
          style={{
            width: "100%",
            justifyContent: "center",
            display: "flex",
            alignItems: "center",
          }}
        >
          <input
            id="graph-filter-search"
            type="text"
            placeholder="search graph"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Button
            size="sm"
            style={{
              height: "1.5rem",
              width: "1.5rem",
              padding: "0rem",
              margin: "0",
            }}
            disabled={searchTerm === null}
            variant="secondary"
            // onClick={handleSearch}
          >
            <IoSearch />
          </Button>
        </span>
        {/* <ButtonGroup id="graph-filter-btn-group">
          <Button
            size="sm"
            style={{ fontSize: "12px" }}
            variant={key === "entities" ? "secondary" : "outline-secondary"}
            active={key === "entities" ? "true": "false"}
            onClick={() => setKey("entities")}
          >
            Entities
          </Button>
          <Button
            size="sm"
            style={{ fontSize: "12px" }}
            active={key === "relations" ? "true": "false"}
            variant={key === "entities" ? "secondary" : "outline-secondary"}
            onClick={() => setKey("relations")}
          >
            Relations
          </Button>
        </ButtonGroup>
        <div style={{ height: "100%", overflowY: "auto" }}>
          {key === "entities" ? (
            <TreeSelect treeData={entityData} graphGroups={graphGroups} />
          ) : (
            <TreeSelect treeData={relationData} graphGroups={graphGroups} />
          )}
        </div> */}
        <p
          style={{
            padding: "0",
            margin: "0",
            fontSize: "0.7rem",
            textAlign: "center",
            color: "grey",
          }}
        >
          Double click graph to reset
        </p>
      </div>
    </div>
  );
};

/* 
  Component for selecting nodes/relations for filtering.
*/
const TreeSelect = ({ treeData, selectList, setSelectList, graphGroups }) => {
  console.log("graphGroups", graphGroups);
  console.log(Object.entries(treeData));

  const readTemplate = (template, data = { items: {} }) => {
    for (const [, value] of Object.entries(template).filter((e) =>
      Object.keys(graphGroups).includes(e[1].name)
    )) {
      if (!value.parent) {
        data.items[value.name] = {
          index: value.name,
          hasChildren: value.children.length !== 0,
          children:
            value.children.length !== 0
              ? value.children.map((c) => c.name)
              : undefined,
          data: value.name,
          fullName: value.fullName,
          colour: value.colour,
        };

        if (value.children.length !== 0) {
          readTemplate(value.children, data);
        }
      }
    }
    data.items["root"] = {
      index: "root",
      hasChildren: true,
      children: template
        .filter((label) => label.parent === undefined)
        .map((parent) => parent.name),
      data: "root",
    };
    return data;
  };

  const handleTreeItemSelect = (item) => {
    console.log(item);
  };

  if (!treeData || graphGroups === undefined) {
    return <div>Loading...</div>;
  } else {
    // console.log(graphGroups);
    // console.log(readTemplate(treeData))

    return (
      <UncontrolledTreeEnvironment
        dataProvider={
          new StaticTreeDataProvider(
            readTemplate(treeData).items,
            (item, data) => ({ ...item, data })
          )
        }
        viewState={{}}
        getItemTitle={(item) => item.data}
        renderItemTitle={({ title, item }) => (
          <span
            id="graph-filter-tree-node-container"
            onClick={() => handleTreeItemSelect(item)}
            // onClick={() => {
            //   console.log(item);
            //   setSelectList(
            //     selectList.includes(item.fullName)
            //       ? selectList.filter((n) => n !== item.fullName)
            //       : [...selectList, item.fullName]
            //   );
            // }}
            title={`${title}`}
          >
            <span id="graph-filter-tree-node">{title}</span>
            <span
              id="graph-filter-tree-node-key"
              style={{
                backgroundColor: item.colour,
              }}
              title="Keybinding"
            ></span>
          </span>
        )}
        defaultInteractionMode={InteractionMode.ClickArrowToExpand}
      >
        <Tree
          treeId="filter-tree"
          rootItem="root"
          treeLabel="Tree based filter"
        />
      </UncontrolledTreeEnvironment>
    );
  }
};
