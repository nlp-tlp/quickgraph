import ReactDOM from "react-dom";
import { useSelector, useDispatch } from "react-redux";

import {
  setActiveModal,
  selectProject,
  selectActiveModal,
  selectModalInfo,
  setModalInfo,
} from "../project/projectSlice";

import { Button, Modal } from "react-bootstrap";

// Modal components
import { Help } from "./help";
import { Settings } from "./settings";
import { Download } from "./Download";
import { Delete } from "./delete";
import { Annotate } from "./annotate";
import { AnnotatorInvite } from "./AnnotatorInvite";
import { AnnotatorRemove } from "./AnnotatorRemove";
import { AnnotatorDocAssign } from "./AnnotatorDocAssign";

export const PortalModal = () => {
  const dispatch = useDispatch();
  const project = useSelector(selectProject);
  const activeModal = useSelector(selectActiveModal);
  const modalInfo = useSelector(selectModalInfo);

  const modalContent = {
    help: {
      title: "Quick Reference Guide",
      body: <Help />,
      modalSize: "modal-wide",
    },
    settings: {
      title: "Settings",
      body: <Settings />,
    },
    download: {
      title: `Download ${modalInfo && modalInfo.downloadType} (${
        project && project.name
      })`,
      body: (
        <Download
          projectId={project && project._id}
          projectName={project && project.name}
        />
      ),
      // modalSize: "modal-wide",
    },
    delete: {
      title: "Delete Project",
      body: (
        <Delete
          projectId={project && project._id}
          projectName={project && project.name}
        />
      ),
    },
    annotate: {
      title: `Annotate Project (${project && project.name})`,
      body: <Annotate projectId={project && project._id} />,
    },
    annotatorInvite: {
      title: "Invite Annotators",
      body: (
        <AnnotatorInvite
          projectId={project && project._id}
          projectAnnotators={project.annotators && project.annotators}
        />
      ),
    },
    annotatorRemove: {
      title: "Remove Annotator",
      body: (
        <AnnotatorRemove projectId={project && project._id} data={modalInfo} />
      ),
    },
    annotatorDocAssign: {
      title: "Document Assignment",
      body: <AnnotatorDocAssign projectId={project && project._id} />,
    },
  };

  if (!activeModal) return null;

  return ReactDOM.createPortal(
    <Modal
      show={activeModal}
      onHide={() => {
        dispatch(setActiveModal(null));
        dispatch(setModalInfo(null));
      }}
      keyboard={false}
      backdrop={modalContent[activeModal].backdrop}
      dialogClassName={modalContent[activeModal].modalSize}
      centered
    >
      <Modal.Header closeButton>
        <Modal.Title>{modalContent[activeModal].title}</Modal.Title>
      </Modal.Header>
      <Modal.Body>{modalContent[activeModal].body}</Modal.Body>
      <Modal.Footer style={{ justifyContent: "left" }}>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => {
            dispatch(setActiveModal(null));
            dispatch(setModalInfo(null));
          }}
        >
          Close
        </Button>
      </Modal.Footer>
    </Modal>,
    document.body
  );
};
