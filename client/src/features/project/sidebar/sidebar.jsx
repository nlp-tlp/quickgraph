import "./Sidebar.css";
import { useEffect, useState } from "react";
import {
  InteractionMode,
  StaticTreeDataProvider,
  Tree,
  UncontrolledTreeEnvironment,
} from "react-complex-tree";
import "react-complex-tree/lib/style.css";
import { useDispatch, useSelector } from "react-redux";
import {
  applyAnnotation,
  selectAnnotationMode,
  selectSelectMode,
  selectTexts,
} from "../../../app/dataSlice"; //"../text/textSlice";
import {
  selectActiveLabel,
  selectKeyBinding,
  selectProject,
  selectProjectStatus,
  setActiveLabel,
} from "../projectSlice";
import { GiClick } from "react-icons/gi";

export const Sidebar = () => {
  const activeLabel = useSelector(selectActiveLabel);
  return <LabelContainer />;
};

const LabelContainer = () => {
  const dispatch = useDispatch();
  const project = useSelector(selectProject);
  const projectStatus = useSelector(selectProjectStatus);
  const selectMode = useSelector(selectSelectMode);
  const texts = useSelector(selectTexts);
  const keyBinding = useSelector(selectKeyBinding);
  const annotationMode = useSelector(selectAnnotationMode);
  const [currentLabel, setCurrentLabel] = useState();
  const [currentKeybinding, setCurrentKeybinding] = useState();
  const [showSettings, setShowSettings] = useState(false);
  const [labelHierarchy, setLabelHierarchy] = useState();
  const [expanded, setExpanded] = useState(false);

  const [treeExpanded, setTreeExpanded] = useState(false);
  const [expandedItems, setExpandedItems] = useState([]);

  useEffect(() => {
    if (projectStatus === "succeeded") {
      setLabelHierarchy(project.entityOntology);
      // Set initial selected label
      setCurrentLabel(project.entityOntology[0].name);
    }
  }, [projectStatus]);

  const readTemplate = (template, data = { items: {} }) => {
    for (const [, value] of Object.entries(template)) {
      // console.log(key, value.name, value.parent);

      if (!value.parent) {
        data.items[value.name] = {
          index: value.name,
          canMove: true,
          hasChildren: value.children.length !== 0,
          children:
            value.children.length !== 0
              ? value.children.map((c) => c.name)
              : undefined,
          data: value.name,
          canRename: true,
          colour: value.colour,
          fullName: value.fullName,
          _id: value._id
            ? value._id
            : project.entityOntology.filter(
                (node) => node.fullName === value.fullName
              )[0]._id, // Due to the recursion, children won't get their mongo _id; need to find manually.
        };

        if (value.children.length !== 0) {
          readTemplate(value.children, data);
        }
      }
    }

    // Add root (without this nothing will render)
    data.items["root"] = {
      index: "root",
      canMove: true,
      hasChildren: true,
      children: template
        .filter((label) => label.parent === undefined)
        .map((parent) => parent.name),
      data: "root",
    };

    // // Key keybinding
    // const addKeybinding = (data, startKey) => {
    //   for (const [key, value] of Object.entries(data)) {
    //     console.log(value.name, `${key}${startKey}`);

    //     if (value.children.length !== 0) {
    //       addKeybinding(value.children, 1);
    //     } else {
    //       startKey += 1;
    //     }
    //   }
    // };
    // addKeybinding(template, 0);

    return data;
  };

  const handleTreeItemSelect = (item) => {
    // Sets active label and annotates any selected text (if concept mode)
    console.log("Selected item:", item);
    setCurrentLabel(item.data);
    dispatch(setActiveLabel(item.data));

    if (annotationMode === "concept") {
      console.log("annotation mode!");
      if (selectMode && selectMode.tokenIds.length > 0) {
        // Note: No enforcement on contiguous tokens is performed here.
        // BUG: User can select across boundaries (TODO: fix)
        console.log("Span selected");

        // Get start and end indexes
        const textId = selectMode.textId;
        const tokenIds = selectMode.tokenIds;

        // Use text object and tokenIds to find token details
        const tokens = texts
          .filter((text) => text._id === textId)[0]
          .tokens.filter((token) => tokenIds.includes(token._id));

        dispatch(
          applyAnnotation({
            entitySpanStart: tokens[0].index,
            entitySpanEnd:
              tokens.length === 1
                ? tokens[0].index
                : tokens[tokens.length - 1].index,
            entityLabel: item.data,
            entityLabelId: item._id,
            textId: textId,
            projectId: project._id,
            applyAll: false,
            suggested: false,
            annotationType: "entity",
          })
        );
      }
    }

    if (annotationMode === "relation") {
      console.log("cool relations!");
    }
  };

  const handleHierarchyExpand = () => {
    /* 
      Function for expanding (flattening) label hierarchy.
      This should put all labels at the same level and make their names
      show their full path e.g. Activity/Event; however, their entity types will
      be the same as usual e.g. /Event if the afforementioned label was applied.
    */
    if (expanded) {
      console.log("closing hierarchy");
      setExpanded(false);
    } else {
      /*
        Expansion is performed by removing parent attributes from
        label nodes so that they are rendered at the same level in the tree
        component.
      */
      console.log("expanding hierarchy - ", labelHierarchy);
      setExpanded(true);
      setLabelHierarchy(
        labelHierarchy.map((label) => ({ ...label, parent: undefined }))
      );

      // function walk(node, path, visited) {
      //   if (path === undefined) {
      //     path = [node.name];
      //   }
      //   if (visited === undefined && node.children) {
      //     visited = [node.name];
      //   }

      //   // console.log('Node:', node.name, path, visited);
      //   // console.log('label', path.join("/"))
      //   if (node.children !== undefined) {
      //     node.children.forEach(function (child) {
      //       console.log("node: ", node.name, "path:", path);
      //       if (child.children.length === 0) {
      //         // console.log(child.name);
      //         path.splice(path.length, 0, child.name);
      //       } else {
      //         path = [...path, child.name];
      //       }
      //       walk(child, path);
      //     });
      //   } else {
      //     console.log("hello?");
      //     path = path.filter((p) => p !== node.name);
      //   }
      // }

      // walk(project.entityOntology[2]);
    }
  };

  // Style using information here:
  // https://rct.lukasbach.com/storybook/?path=/docs/core-custom-renderers--minimal-renderers
  if (projectStatus !== "succeeded") {
    // console.log("waiting for lift off...");
    return <div>loading...</div>;
  } else {
    // console.log("blast off!");
    // console.log(labelHierarchy);
    // console.log(labelHierarchy && readTemplate(labelHierarchy));
    // console.log(labelHierarchy && labelHierarchy.map((label) => label.name));

    return (
      <div className="complex-tree-container">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "0rem 1rem",
            fontWeight: "bold",
            color: "rgb(55, 71, 79)",
            userSelect: "none",
          }}
        >
          <span>Entities</span>
          <GiClick />
        </div>
        {labelHierarchy && (
          <UncontrolledTreeEnvironment
            dataProvider={
              new StaticTreeDataProvider(
                readTemplate(labelHierarchy).items,
                (item, data) => ({ ...item, data })
              )
            }
            getItemTitle={(item) => item.data}
            viewState={
              {
                // ["tree-1"]: {
                //   expandedItems: expandedItems,
                // },
              }
            } // Nothing as don't want to expand tree
            renderItemTitle={({ title, item }) => (
              <span
                className="node-container"
                style={{
                  backgroundColor: currentLabel === title && "#b0bec5",
                }}
                onClick={() => handleTreeItemSelect(item)}
                title={`${item.fullName}`}
              >
                <span className="node">{title}</span>
                <span
                  className="node-key"
                  style={{
                    backgroundColor: item.colour,
                  }}
                  title="Keybinding"
                ></span>
              </span>
            )}
            canDragAndDrop={true}
            canReorderItems={true}
            canSearch={true}
            defaultInteractionMode={InteractionMode.ClickArrowToExpand}
          >
            <Tree treeId="tree-1" rootItem="root" treeLabel="Tree Example" />
          </UncontrolledTreeEnvironment>
        )}
        {/* <div
          style={{
            display: "flex",
            justifyContent: "center",
            margin: "0.5rem 0rem",
          }}
        >
          <Button
            size="sm"
            variant="secondary"
            style={{ marginTop: "auto auto" }}
            onClick={() => {
              setTreeExpanded(!treeExpanded);
              setExpandedItems(labelHierarchy.map((label) => label.name));
            }}
            disabled
          >
            {treeExpanded ? "Collapse" : "Expand"}
          </Button>
        </div> */}
      </div>
    );
  }
};
