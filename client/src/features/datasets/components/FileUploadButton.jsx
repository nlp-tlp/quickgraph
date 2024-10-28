import { useState, useEffect, forwardRef, useContext } from "react";
import { Button } from "@mui/material";
import { FileUpload as FileUploadIcon } from "@mui/icons-material";
import { SnackbarContext } from "../../../shared/context/snackbar-context";

const FileUploadButton = forwardRef(
  ({ onUpload, size = "medium", label = "Upload" }, ref) => {
    const [fileContents, setFileContents] = useState(null);
    const [fileExtension, setFileExtension] = useState(null);
    const [inputKey, setInputKey] = useState(Date.now());
    const [snackbarState, snackbarDispatch] = useContext(SnackbarContext);

    useEffect(() => {
      onUpload({ fileExtension, fileContents });
    }, [fileContents]);

    const handleFileUpload = (event) => {
      const file = event.target.files[0];

      if (!file) {
        return;
      }

      const reader = new FileReader();

      reader.onload = (event) => {
        const fileContents = event.target.result;
        const _fileExtension = file.name.split(".").pop().toLowerCase();
        setFileExtension(_fileExtension);

        if (_fileExtension === "txt") {
          // Handle .txt file contents
          setFileContents(fileContents);
        } else if (_fileExtension === "json") {
          // Handle .json file contents
          try {
            const jsonData = JSON.parse(fileContents);
            setFileContents(jsonData);
          } catch (error) {
            snackbarDispatch({
              type: "UPDATE_SNACKBAR",
              payload: {
                message: `Error parsing JSON: ${error}`,
                severity: "error",
              },
            });
          }
        } else {
          snackbarDispatch({
            type: "UPDATE_SNACKBAR",
            payload: {
              message: `"Invalid file type: ${_fileExtension}`,
              severity: "error",
            },
          });
        }
      };

      reader.readAsText(file);

      // Reset the value of the file input
      event.target.value = null;
      event.target.files = null;

      // Increment the inputKey to force the file input to re-render
      setInputKey(Date.now());
    };

    return (
      <div>
        <Button component="label" startIcon={<FileUploadIcon />} size={size}>
          <input
            key={inputKey}
            ref={ref}
            hidden
            type="file"
            accept=".txt,.json"
            onChange={handleFileUpload}
          />
          {label}
        </Button>
      </div>
    );
  }
);

export default FileUploadButton;
