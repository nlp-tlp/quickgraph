import SortableTree, {
  addNodeUnderParent,
  changeNodeAtPath,
  removeNodeAtPath,
} from "@nosferatu500/react-sortable-tree";
// Using forked version of react-sortable-tree as version at date 15.12.21 isn't react v17 compatible.
import "@nosferatu500/react-sortable-tree/style.css";
import { useEffect, useState } from "react";
import { Button, Col, Form, Modal, Row, Tab, Tabs } from "react-bootstrap";
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

export const Schema = () => {
  const dispatch = useDispatch();
  const steps = useSelector(selectSteps);
  const activeStep = useSelector(selectActiveStep);
  const performRelationAnnotation = useSelector(
    selectPerformRelationAnnotation
  );

  const [entityDataPreset, setEntityDataPreset] = useState(
    steps[activeStep].data.conceptName !== ""
      ? steps[activeStep].data.conceptName
      : "Custom"
  );
  const [relationDataPreset, setRelationDataPreset] = useState(
    steps[activeStep].data.relationName !== ""
      ? steps[activeStep].data.relationName
      : "Custom"
  );
  const [entityData, setEntityData] = useState({
    treeData:
      steps[activeStep].data.conceptLabels.length > 0
        ? steps[activeStep].data.conceptLabels
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
    const conceptsValid =
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

      if (!valid && conceptsValid && relationsValid) {
        dispatch(setStepValid(true));
      }
      if (valid && !conceptsValid) {
        dispatch(setStepValid(false));
      }
      if (valid && !relationsValid) {
        dispatch(setStepValid(false));
      }
    } else {
      if (!valid && conceptsValid) {
        dispatch(setStepValid(true));
      }
      if (valid && !conceptsValid) {
        dispatch(setStepValid(false));
      }
    }
  }, [steps, entityData, relationData]);

  useEffect(() => {
    // Side effect for capturing tree data changes
    dispatch(
      setStepData({
        conceptName: entityDataPreset,
        conceptLabels: entityData.treeData,
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
    <Row style={{ margin: "0rem 0.25rem 0rem 0.25rem" }}>
      <Col>
        <Tabs id="controlled-tab-example" className="mb-3">
          <Tab eventKey="concepts" title="Entity Types">
            <OntologyContainer
              presetOntologies={entityOntologies}
              treeData={entityData}
              setTreeData={setEntityData}
              ontologyType={"entity"}
              selectValue={entityDataPreset}
            />
          </Tab>
          {performRelationAnnotation &&
            steps.details.data.relationAnnotationType === "closed" && (
              <Tab eventKey="relations" title="Relation Types">
                <OntologyContainer
                  presetOntologies={relationOntologies}
                  treeData={relationData}
                  setTreeData={setRelationData}
                  ontologyType={"relation"}
                  selectValue={relationDataPreset}
                  entityOntology={entityData} // Used for selecting entities for domain/range
                />
              </Tab>
            )}
        </Tabs>
      </Col>
    </Row>
  );
};

const OntologyContainer = ({
  presetOntologies,
  treeData,
  setTreeData,
  ontologyType,
  selectValue,
  entityOntology,
}) => {
  const dispatch = useDispatch();
  const getNodeKey = ({ treeIndex }) => treeIndex;
  const [showAlert, setShowAlert] = useState(false);
  const [showDomainRange, setShowDomainRange] = useState(false);
  const [selectedNode, setSelectedNode] = useState();

  // useEffect(() => {
  //   console.log(treeData);
  //   console.log(
  //     getFlatDataFromTree({
  //       treeData: treeData.treeData,
  //       getNodeKey: ({ treeIndex }) => treeIndex,
  //       ignoreCollapsed: false,
  //     })
  //   );
  // }, [treeData]);

  if (treeData && !treeData.treeData) {
    return (
      <div style={{ textAlign: "center", marginTop: "auto" }}>
        <span>
          Select a preset {ontologyType} ontology, upload or create your own!
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
        <Row className="schema">
          <Col sm={12} md={12}>
            <Form.Group>
              <Form.Label>
                {/* TODO: implement upload functionality; will allow user to upload as either json or .owl */}
                {/* or <a>upload</a> */}
                Create an {ontologyType} ontology, or select a preset!
              </Form.Label>
              <Form.Control
                as="select"
                onChange={(e) => {
                  setTreeData((prevState) => ({
                    ...prevState,
                    treeData: presetOntologies[e.target.value],
                  }));
                  ontologyType === "entity"
                    ? dispatch(
                        setStepData({
                          conceptName: e.target.value,
                          conceptLabels: presetOntologies[e.target.value],
                        })
                      )
                    : dispatch(
                        setStepData({
                          relationName: e.target.value,
                          relationLabels: presetOntologies[e.target.value],
                        })
                      );
                }}
              >
                <option key={selectValue}>{selectValue}</option>
                {Object.keys(presetOntologies)
                  .filter((name) => name !== selectValue)
                  .map((name) => (
                    <option key={name}>{name}</option>
                  ))}
              </Form.Control>
            </Form.Group>
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
                treeData={treeData.treeData}
                onChange={(treeData) => setTreeData({ treeData })}
                generateNodeProps={({ node, path }) => ({
                  style: { backgroundColor: "orange" },
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
                        setTreeData((state) => ({
                          treeData: changeNodeAtPath({
                            treeData: state.treeData,
                            path,
                            getNodeKey,
                            newNode: { ...node, name },
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
                        onClick={() => console.log("hello")}
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
                        console.log(treeData.treeData);
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
                                    fullName: "",
                                    parentKey: path[path.length - 1],
                                    domain: [],
                                    range: [],
                                    placeholder: "Enter relation name",
                                    id: uuidv4(),
                                  }
                                : {
                                    name: "",
                                    parentKey: path[path.length - 1],
                                    colour: node.colour,
                                    id: uuidv4(),
                                    placeholder: "Enter entity name",
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
            <Button
              style={{ margin: "0.25rem" }}
              size="sm"
              variant="success"
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
                          id: uuidv4(),
                        }
                      : {
                          name: "",
                          fullName: [],
                          colour: getRandomColor(),
                          placeholder: "Enter entity name",
                          id: uuidv4(),
                        }
                  ),
                }))
              }
            >
              Add branch node
            </Button>
            <Button
              style={{ margin: "0.25rem" }}
              size="sm"
              variant="dark"
              onClick={() => setShowAlert(true)}
            >
              Clear all
            </Button>
          </Col>
        </Row>
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
          conceptName: "Custom",
          conceptLabels: presetOntologies["Custom"],
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
    <Modal show={showAlert} onHide={() => setShowAlert(false)}>
      <Modal.Header closeButton>
        <Modal.Title>Are you sure?</Modal.Title>
      </Modal.Header>
      <Modal.Body>Clearing your ontology cannot be undone!</Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={() => setShowAlert(false)}>
          Close
        </Button>
        <Button variant="danger" onClick={handleClearAll}>
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

  console.log("entity ontology", entityOntology);
  console.log("node", selectedNode);

  const handleSave = () => {
    // Sets node domain and range in tree
    const updatedTree = changeNodeAtPath({
      treeData: treeData.treeData,
      path: selectedNode.path,
      newNode: { ...selectedNode, domain: domain, range: range },
      getNodeKey: ({ treeIndex }) => treeIndex,
    });
    // console.log(updatedTree);
    setTreeData({ ...treeData, treeData: updatedTree });
    setShowDomainRange(false);
  };

  useEffect(() => {
    console.log("domain", domain);
    console.log("range", range);
  }, [domain, range]);

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
        <Row>
          <Col>
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
          </Col>
          <Col>
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
          </Col>
        </Row>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={() => setShowDomainRange(false)}>
          Cancel
        </Button>
        <Button variant="success" onClick={handleSave}>
          Save
        </Button>
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
                console.log(item);
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
        <div
          style={{
            display: "flex",
            justifyContent: "space-evenly",
            width: "100%",
            marginTop: "0.5rem",
          }}
        >
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setSelectList([])}
          >
            Clear
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setSelectList(["all"])}
          >
            Select all
          </Button>
        </div>
      </>
    );
  }
};
