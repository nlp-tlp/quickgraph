/**
 *
 * Very similar to `/datasets/components/FileUploadButton.jsx` - TODO: refactor into single component in the future.
 */
import { useState, useEffect, forwardRef } from "react";
import { Button } from "@mui/material";
import { FileUpload as FileUploadIcon } from "@mui/icons-material";

const FileUploadButton = forwardRef(({ onUpload }, ref) => {
  const [fileContents, setFileContents] = useState(null);
  const [fileExtension, setFileExtension] = useState(null);
  const [inputKey, setInputKey] = useState(Date.now());

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
      const extension = file.name.split(".").pop().toLowerCase();
      setFileExtension(extension);

      if (extension === "csv") {
        // Handle .csv file contents
        const lines = fileContents.split(/\r\n|\n/);
        const headers = lines[0].split(",");
        const data = [];

        for (let i = 1; i < lines.length; i++) {
          const fields = lines[i].split(",");
          const obj = {};

          for (let j = 0; j < headers.length; j++) {
            obj[headers[j].trim()] = fields[j].trim();
          }

          data.push(obj);
        }

        console.log("csv data", data);

        setFileContents(data);
      } else if (extension === "json") {
        // Handle .json file contents
        try {
          const jsonData = JSON.parse(fileContents);
          setFileContents(jsonData);
        } catch (error) {
          console.error("Error parsing JSON:", error);
        }
      } else {
        console.error("Invalid file type:", extension);
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
      <Button component="label" startIcon={<FileUploadIcon />}>
        <input
          key={inputKey}
          ref={ref}
          hidden
          type="file"
          accept=".csv,.json"
          onChange={handleFileUpload}
        />
        Upload
      </Button>
    </div>
  );
});

export default FileUploadButton;
