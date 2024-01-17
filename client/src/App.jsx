import React, { useState } from "react";
import axios from "axios";

const FileUploadComponent = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploaded, setUploaded] = useState(null);

  const handleFileChange = (event) => {
    setSelectedFile(event.target.files[0]);
  };

  const handleUpload = () => {
    if (!selectedFile) {
      alert("Please select a file");
      return;
    }

    const formData = new FormData();
    formData.append("file", selectedFile);

    axios.post("http://localhost:3000/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        onUploadProgress: (data) => {
          setUploaded(Math.round((data.loaded / data.total) * 100));
        },
      }).then((response) => {
        console.log(response.data);
      }).catch((error) => {
        console.error("Error uploading file:", error);
      });
  };

  return (
    <div>
      <input type="file" onChange={handleFileChange} />
      <button onClick={handleUpload}>Upload</button>
      {uploaded && (
          <div className="progress mt-2">
            <div
              className="progress-bar"
              role="progressbar"
              aria-valuenow={uploaded}
              aria-valuemin="0"
              aria-valuemax="100"
              style={{ width: `${uploaded}%` }}
            >
              {`${uploaded}%`}
            </div>
          </div>
        )}

    </div>
  );
};

export default FileUploadComponent;
