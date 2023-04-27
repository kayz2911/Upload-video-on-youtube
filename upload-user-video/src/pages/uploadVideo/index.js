import { useState } from "react";
import axios from "axios";

function VideoUpload() {
  const [selectedFile, setSelectedFile] = useState(null);

  const handleFileChange = (event) => {
    setSelectedFile(event.target.files[0]);
    console.log(selectedFile);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const videoData = new FormData();

    videoData.append("title", "abc");
    videoData.append("description", "abc");
    videoData.append("videoFile", selectedFile);

    axios
      .post("http://localhost:8000/upload", videoData, {
        withCredentials: true,
      })
      .then((response) => {
        const { authorizationUrl } = response.data;
        window.location.href = authorizationUrl;
      });
  };

  return (
    <form onSubmit={handleSubmit}>
      <label htmlFor="video">Select a video file:</label>
      <input
        id="video"
        type="file"
        accept="video/*"
        onChange={handleFileChange}
      />
      <button type="submit" disabled={!selectedFile}>
        Upload
      </button>
    </form>
  );
}

export default VideoUpload;
