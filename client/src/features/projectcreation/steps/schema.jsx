import "react-sortable-tree/style.css";
import {
  addNodeUnderParent,
  changeNodeAtPath,
  getFlatDataFromTree,
  getNodeAtPath,
  removeNodeAtPath,
} from "react-sortable-tree";
import SortableTree from "react-sortable-tree";
import { useEffect, useState } from "react";
import { Modal } from "react-bootstrap";
import {
  InteractionMode,
  StaticTreeDataProvider,
  Tree,
  UncontrolledTreeEnvironment,
} from "react-complex-tree";
import "react-complex-tree/lib/style.css";
import {
  IoBrush,
  IoCloseCircle,
  IoEllipsisVerticalCircleSharp,
  IoFunnel,
} from "react-icons/io5";
import { useDispatch, useSelector } from "react-redux";
import {
  selectActiveStep,
  selectPerformRelationAnnotation,
  selectSteps,
  setStepData,
  setStepValid,
} from "../createStepSlice";
import { entityOntologies, relationOntologies } from "../data/ontologies";
import { getRandomColor } from "../data/utils";
import { v4 as uuidv4 } from "uuid";

import { getFlatOntology } from "../../project/utils";

import {
  Grid,
  Tabs,
  Tab,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  Button,
} from "@mui/material";

export const Schema = () => {
  const dispatch = useDispatch();
  const steps = useSelector(selectSteps);
  const activeStep = useSelector(selectActiveStep);
  const performRelationAnnotation = useSelector(
    selectPerformRelationAnnotation
  );

  const [value, setValue] = useState("entity");

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  const [entityDataPreset, setEntityDataPreset] = useState(
    steps[activeStep].data.entityName !== ""
      ? steps[activeStep].data.entityName
      : "Custom"
  );
  const [relationDataPreset, setRelationDataPreset] = useState(
    steps[activeStep].data.relationName !== ""
      ? steps[activeStep].data.relationName
      : "Custom"
  );
  const [entityData, setEntityData] = useState({
    treeData:
      steps[activeStep].data.entityLabels.length > 0
        ? steps[activeStep].data.entityLabels
        : entityOntologies["Custom"],
    addAsFirstChild: false,
  });
  const [relationData, setRelationData] = useState({
    treeData:
      steps[activeStep].data.relationLabels.length > 0
        ? steps[activeStep].data.relationLabels
        : relationOntologies["Custom"],
    addAsFirstChild: false,
  });

  useEffect(() => {
    // Side effect if user switches between presets
    // Only looks at the top level nodes; if any child are empty, they will be removed later.
    const valid = steps[activeStep].valid;
    const entitiesValid =
      entityData.treeData.filter((node) => node.name !== "").length > 0;

    // console.log(
    //   "entityData.treeData",
    //   entityData.treeData,
    //   getFlatDataFromTree(
    //     entityData.treeData,
    //     ({ treeIndex }) => treeIndex,
    //     false
    //   )
    // );

    if (
      performRelationAnnotation &&
      steps.details.data.relationAnnotationType === "closed"
    ) {
      const relationsValid =
        relationData.treeData.filter((node) => node.name !== "").length > 0;

      if (!valid && entitiesValid && relationsValid) {
        dispatch(setStepValid(true));
      }
      if (valid && !entitiesValid) {
        dispatch(setStepValid(false));
      }
      if (valid && !relationsValid) {
        dispatch(setStepValid(false));
      }
    } else {
      if (!valid && entitiesValid) {
        dispatch(setStepValid(true));
      }
      if (valid && !entitiesValid) {
        dispatch(setStepValid(false));
      }
    }
  }, [steps, entityData, relationData]);

  useEffect(() => {
    // Side effect for capturing tree data changes
    dispatch(
      setStepData({
        entityName: entityDataPreset,
        entityLabels: entityData.treeData,
      })
    );
    dispatch(
      setStepData({
        relationName: relationDataPreset,
        relationLabels: relationData.treeData,
      })
    );
  }, [entityData, relationData]);

  return (
    <Grid item xs={12}>
      <Tabs
        centered
        value={value}
        onChange={handleChange}
        textColor="primary"
        indicatorColor="primary"
      >
        <Tab value="entity" label="Entity Types" />
        {performRelationAnnotation &&
          steps.details.data.relationAnnotationType === "closed" && (
            <Tab value="relation" label="Relation Types" />
          )}
      </Tabs>
      {value === "entity" ? (
        <OntologyContainer
          presetOntologies={entityOntologies}
          treeData={entityData}
          setTreeData={setEntityData}
          ontologyType={"entity"}
          selectValue={entityDataPreset}
          setSelectValue={setEntityDataPreset}
        />
      ) : (
        <OntologyContainer
          presetOntologies={relationOntologies}
          treeData={relationData}
          setTreeData={setRelationData}
          ontologyType={"relation"}
          selectValue={relationDataPreset}
          setSelectValue={setRelationDataPreset}
          entityOntology={entityData} // Used for selecting entities for domain/range
        />
      )}
    </Grid>
  );
};

const OntologyContainer = ({
  presetOntologies,
  treeData,
  setTreeData,
  ontologyType,
  selectValue,
  setSelectValue,
  entityOntology,
}) => {
  const dispatch = useDispatch();
  const getNodeKey = ({ treeIndex }) => treeIndex;
  const [showAlert, setShowAlert] = useState(false);
  const [showDomainRange, setShowDomainRange] = useState(false);
  const [selectedNode, setSelectedNode] = useState();

  const handlePresetChange = (e) => {
    setTreeData((prevState) => ({
      ...prevState,
      treeData: presetOntologies[e.target.value],
    }));

    // Ontology preset name
    setSelectValue(e.target.value);

    ontologyType === "entity"
      ? dispatch(
          setStepData({
            entityName: e.target.value,
            entityLabels: presetOntologies[e.target.value],
          })
        )
      : dispatch(
          setStepData({
            relationName: e.target.value,
            relationLabels: presetOntologies[e.target.value],
          })
        );
  };

  if (treeData && !treeData.treeData) {
    return (
      <div style={{ textAlign: "center", marginTop: "auto" }}>
        <span>
          Select <span style={{ textDecoration: "underline" }}>Custom</span> to
          build your own ontology or select a preset
        </span>
      </div>
    );
  } else {
    return (
      <>
        {showAlert && (
          <AlertModal
            showAlert={showAlert}
            setShowAlert={setShowAlert}
            setTreeData={setTreeData}
            presetOntologies={presetOntologies}
            ontologyType={ontologyType}
          />
        )}
        {showDomainRange && (
          <DomainRangeModal
            showDomainRange={showDomainRange}
            setShowDomainRange={setShowDomainRange}
            selectedNode={selectedNode}
            entityOntology={entityOntology}
            treeData={treeData}
            setTreeData={setTreeData}
          />
        )}
        <Grid item container xs={12}>
          <Grid item xs={12}>
            {/* TODO: implement upload functionality; will allow user to upload as either json or .owl */}
            {/* or <a>upload</a> */}
            Select <span style={{ textDecoration: "underline" }}>
              Custom
            </span>{" "}
            to build your own ontology or select a preset
          </Grid>
          <Grid item xs={12} sx={{ mt: 2 }}>
            <FormControl fullWidth>
              <InputLabel id="ontology-preset-select-label">
                Preset Ontologies
              </InputLabel>
              <Select
                labelId="ontology-preset-select-label"
                id="ontology-preset-select"
                label="Preset Ontologies"
                value={selectValue}
                onChange={(e) => handlePresetChange(e)}
              >
                {Object.keys(presetOntologies).map((name) => (
                  <MenuItem key={name} value={name}>
                    {name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sx={{ mt: 2 }}>
            <div
              style={{
                minHeight: "250px",
                height: "300px",
                border: "1px solid #ced4da",
                borderRadius: "0.25rem",
                overflowY: "auto",
              }}
            >
              <SortableTree
                isVirtualized={false}
                treeData={treeData.treeData}
                canDrag={false}
                onChange={(treeData) => {
                  // console.log(treeData);
                  setTreeData({ treeData });
                }}
                generateNodeProps={({ node, path }) => ({
                  // Update name of existing node
                  title: (
                    <input
                      style={{
                        fontSize: "0.8rem",
                        padding: "0.2rem",
                        width: "100%",
                      }}
                      value={node.name}
                      placeholder={node.placeholder}
                      onChange={(event) => {
                        const name = event.target.value;
                        // console.log('node', node, 'path', path, 'parentKey', path[path.length - 1], 'tree data', treeData.treeData, 'parent node', treeData.treeData[path[path.length-1]]);

                        const rootNode = path.length === 1;
                        // console.log(path, rootNode);
                        // console.log(treeData.treeData, path[path.length - 1]);

                        setTreeData((state) => ({
                          treeData: changeNodeAtPath({
                            treeData: state.treeData,
                            path,
                            getNodeKey,
                            newNode: {
                              ...node,
                              name: name,
                              fullName: rootNode ? name : node.fullName + name,
                            },
                          }),
                        }));
                      }}
                    />
                  ),
                  buttons: [
                    ontologyType === "entity" && (
                      <IoBrush
                        style={{
                          color: node.colour ? node.colour : "grey",
                          fontSize: "1rem",
                          // cursor: "pointer",
                          marginRight: "0.2rem",
                        }}
                        // title="Click to modify colour of branch."
                        // onClick={() => console.log("hello")}
                      />
                    ),
                    <IoEllipsisVerticalCircleSharp
                      style={{
                        color: "#455a64",
                        fontSize: "1.25rem",
                        cursor: "pointer",
                        marginRight: "0.2rem",
                      }}
                      title="Click to add child leaf"
                      onClick={() => {
                        // console.log("adding child leaf");
                        setTreeData((state) => ({
                          treeData: addNodeUnderParent({
                            treeData: state.treeData,
                            parentKey: path[path.length - 1],
                            expandParent: true,
                            getNodeKey,
                            newNode:
                              ontologyType === "relation"
                                ? {
                                    name: "",
                                    fullName:
                                      getFlatOntology(state.treeData)[
                                        path[path.length - 1]
                                      ].fullName + "/",
                                    parentKey: path[path.length - 1],
                                    domain: [],
                                    range: [],
                                    placeholder: "Enter relation name",
                                    _id: uuidv4(),
                                    isEntity: false,
                                  }
                                : {
                                    name: "",
                                    fullName:
                                      getFlatOntology(state.treeData)[
                                        path[path.length - 1]
                                      ].fullName + "/",
                                    parentKey: path[path.length - 1],
                                    colour: node.colour,
                                    _id: uuidv4(),
                                    placeholder: "Enter entity name",
                                    isEntity: true,
                                  },
                            addAsFirstChild: state.addAsFirstChild,
                          }).treeData,
                        }));
                      }}
                    />,
                    ontologyType === "relation" && (
                      <IoFunnel
                        style={{
                          color: "#455a64",
                          fontSize: "1rem",
                          cursor: "pointer",
                        }}
                        title="Click to edit domain/range"
                        onClick={() => {
                          setSelectedNode({ ...node, path: path });
                          setShowDomainRange(true);
                        }}
                      />
                    ),
                    <IoCloseCircle
                      style={{
                        color: "#e53935",
                        fontSize: "1.25rem",
                        cursor: "pointer",
                        display: node.id === 0 && "none",
                      }}
                      title="Click to remove branch"
                      onClick={() =>
                        setTreeData((state) => ({
                          treeData: removeNodeAtPath({
                            treeData: state.treeData,
                            path,
                            getNodeKey,
                          }),
                        }))
                      }
                    />,
                  ],
                })}
              />
            </div>
          </Grid>

          <Grid item xs={12} sx={{ mt: 2 }}>
            <Stack direction="row" spacing={2}>
              <Button
                variant="contained"
                disableElevation
                color="primary"
                size="small"
                onClick={() =>
                  setTreeData((state) => ({
                    treeData: state.treeData.concat(
                      ontologyType === "relation"
                        ? {
                            name: "",
                            fullName: "",
                            domain: [],
                            range: [],
                            placeholder: "Enter relation name",
                            _id: uuidv4(),
                            isEntity: false,
                          }
                        : {
                            name: "",
                            fullName: "",
                            colour: getRandomColor(),
                            placeholder: "Enter entity name",
                            _id: uuidv4(),
                            isEntity: true,
                          }
                    ),
                  }))
                }
              >
                Add branch node
              </Button>
              <Button
                variant="contained"
                disableElevation
                color="error"
                size="small"
                onClick={() => setShowAlert(true)}
              >
                Clear all
              </Button>
            </Stack>
          </Grid>
        </Grid>
      </>
    );
  }
};

const AlertModal = ({
  showAlert,
  setShowAlert,
  setTreeData,
  presetOntologies,
  ontologyType,
}) => {
  const dispatch = useDispatch();
  const handleClearAll = () => {
    setTreeData((prevState) => ({
      ...prevState,
      treeData: presetOntologies["Custom"],
    }));
    setShowAlert(false);

    if (ontologyType === "entity") {
      dispatch(
        setStepData({
          entityName: "Custom",
          entityLabels: presetOntologies["Custom"],
        })
      );
    } else {
      dispatch(
        setStepData({
          relationName: "Custom",
          relationLabels: presetOntologies["Custom"],
        })
      );
    }
  };

  return (
    <Modal
      show={showAlert}
      onHide={() => setShowAlert(false)}
      style={{ zIndex: 1999 }}
      centered
    >
      <Modal.Header closeButton>
        <Modal.Title>Are you sure?</Modal.Title>
      </Modal.Header>
      <Modal.Body>Clearing your ontology cannot be undone!</Modal.Body>
      <Modal.Footer>
        <Button color="secondary" onClick={() => setShowAlert(false)}>
          Close
        </Button>
        <Button color="error" onClick={handleClearAll}>
          Clear
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

const DomainRangeModal = ({
  showDomainRange,
  setShowDomainRange,
  selectedNode,
  entityOntology,
  treeData,
  setTreeData,
}) => {
  const [domain, setDomain] = useState(selectedNode.domain);
  const [range, setRange] = useState(selectedNode.range);

  const handleSave = () => {
    // Sets node domain and range in tree
    const updatedTree = changeNodeAtPath({
      treeData: treeData.treeData,
      path: selectedNode.path,
      newNode: { ...selectedNode, domain: domain, range: range },
      getNodeKey: ({ treeIndex }) => treeIndex,
    });
    setTreeData({ ...treeData, treeData: updatedTree });
    setShowDomainRange(false);
  };

  // useEffect(() => {
  //   console.log("domain", domain);
  //   console.log("range", range);
  // }, [domain, range]);

  return (
    <Modal
      show={showDomainRange}
      onHide={() => setShowDomainRange(false)}
      centered
    >
      <Modal.Header>
        <Modal.Title>{selectedNode.fullName}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Grid item xs={12} container spacing={2}>
          <Grid item xs={6}>
            <p
              style={{
                textAlign: "center",
                fontWeight: "bold",
                padding: "0",
                margin: "0",
                fontSize: "1rem",
              }}
            >
              Domain{" "}
              {domain && domain.includes("all")
                ? "(all)"
                : `(${domain.length})`}
            </p>
            <DomainRangeTreeSelect
              entityOntology={entityOntology}
              selectList={domain}
              setSelectList={setDomain}
              type="domain"
            />
          </Grid>
          <Grid item xs={6}>
            <p
              style={{
                textAlign: "center",
                fontWeight: "bold",
                padding: "0",
                margin: "0",
                fontSize: "1rem",
              }}
            >
              Range{" "}
              {range && range.includes("all") ? "(all)" : `(${range.length})`}
            </p>
            <DomainRangeTreeSelect
              entityOntology={entityOntology}
              selectList={range}
              setSelectList={setRange}
              type="range"
            />
          </Grid>
        </Grid>
      </Modal.Body>
      <Modal.Footer>
        <Stack direction="row" spacing={2}>
          <Button onClick={() => setShowDomainRange(false)}>Cancel</Button>
          <Button
            variant="contained"
            disableElevation
            color="primary"
            onClick={handleSave}
          >
            Save
          </Button>
        </Stack>
      </Modal.Footer>
    </Modal>
  );
};

const DomainRangeTreeSelect = ({
  entityOntology,
  selectList,
  setSelectList,
  type,
}) => {
  const readTemplate = (template, data = { items: {} }) => {
    for (const [, value] of Object.entries(template)) {
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

  if (!entityOntology.treeData) {
    return <div>Loading...</div>;
  } else {
    return (
      <>
        <UncontrolledTreeEnvironment
          dataProvider={
            new StaticTreeDataProvider(
              readTemplate(entityOntology.treeData).items,
              (item, data) => ({ ...item, data })
            )
          }
          viewState={{}}
          getItemTitle={(item) => item.data}
          renderItemTitle={({ title, item }) => (
            <span
              style={{
                width: "100%",
                fontSize: "0.9rem",
                justifyContent: "space-between",
                backgroundColor:
                  (selectList.includes(item.fullName) ||
                    selectList.includes("all")) &&
                  "#a5d6a7",
                display: "flex",
              }}
              onClick={() => {
                // console.log(item);
                setSelectList(
                  selectList.includes(item.fullName)
                    ? selectList.filter((n) => n !== item.fullName)
                    : [...selectList, item.fullName]
                );
              }}
              title={`${title}`}
            >
              <span
                style={{
                  marginLeft: "0.25rem",
                  display: "block",
                  whiteSpace: "nowrap",
                  overflowX: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {title}
              </span>
            </span>
          )}
          defaultInteractionMode={InteractionMode.ClickArrowToExpand}
        >
          <Tree
            treeId={`Tree-${type}`}
            rootItem="root"
            treeLabel={`Relation ${type} tree`}
          />
        </UncontrolledTreeEnvironment>
        <Stack direction="row" spacing={2} justifyContent="center">
          <Button color="error" onClick={() => setSelectList([])}>
            Clear
          </Button>
          <Button onClick={() => setSelectList(["all"])}>Select all</Button>
        </Stack>
      </>
    );
  }
};
