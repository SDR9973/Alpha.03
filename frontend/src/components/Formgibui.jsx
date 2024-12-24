import React, { useState } from "react";
import { Form, Button, Alert } from "react-bootstrap";
import { Bar } from "react-chartjs-2";
import { ForceGraph2D } from "react-force-graph";

const UploadWhatsAppFile = () => {
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState("");
  const [uploadedFile, setUploadedFile] = useState("");
  const [chartData, setChartData] = useState(null);
  const [networkData, setNetworkData] = useState(null);
  const [filter, setFilter] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [messageLimit, setMessageLimit] = useState(50); // הגבלת כמות ברירת מחדל

  const handleFileChange = (event) => {
    setFile(event.target.files[0]);
    setMessage("");
    setUploadedFile("");
    setChartData(null);
    setNetworkData(null);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!file) {
      setMessage("Please select a file before uploading.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    fetch("http://localhost:8000/upload", {
      method: "POST",
      body: formData,
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.message) {
          setMessage(data.message);
          setUploadedFile(data.filename);
        }
      })
      .catch(() => setMessage("An error occurred during the upload."));
  };

  const handleDelete = () => {
    fetch(`http://localhost:8000/delete/${uploadedFile}`, { method: "DELETE" })
      .then((response) => response.json())
      .then((data) => {
        setMessage(data.message || "File deleted successfully!");
        setUploadedFile("");
        setChartData(null);
        setNetworkData(null);
      })
      .catch(() =>
        setMessage("An error occurred during the delete operation.")
      );
  };

  const handleAnalysis = () => {
    fetch(`http://localhost:8000/analyze/${uploadedFile}`)
      .then((response) => response.json())
      .then((data) => {
        if (data.analysis) {
          const labels = Object.keys(data.analysis).slice(0, 10);
          const counts = Object.values(data.analysis).slice(0, 10);
          setChartData({
            labels,
            datasets: [
              {
                label: "Word Frequency",
                data: counts,
                backgroundColor: "rgba(75,192,192,0.6)",
              },
            ],
          });
        }
      })
      .catch(() => setMessage("An error occurred during analysis."));
  };

  // const handleNetworkAnalysis = () => {
  //   let url = `http://localhost:8000/analyze/network/${uploadedFile}`;
  //   if (startDate && endDate) {
  //     url += `?start_date=${startDate}&end_date=${endDate}`;
  //   }
  //   console.log("Request URL:", url);
   
  //   fetch(url)
  //     .then((response) => response.json())
  //     .then((data) => {
  //       console.log("Data returned from server:", data); // הדפסת תגובת השרת
  //       if (data.nodes && data.links) {
  //         setNetworkData(data);
  //       } else {
  //         setMessage("No data returned from server.");
  //         console.log("No nodes or links found in the response.");
  //       }
  //     })
  //     .catch((err) => {
  //       setMessage("An error occurred during network analysis.");
  //       console.error("Error during network analysis:", err);
  //     });
  // };

  const handleNetworkAnalysis = () => {
    let url = `http://localhost:8000/analyze/network/${uploadedFile}`;
    
    const params = new URLSearchParams();
    if (startDate) params.append("start_date", startDate);
    if (endDate) params.append("end_date", endDate);
    if (messageLimit) params.append("limit", messageLimit);
  
    // הרכבת ה-URL עם הפרמטרים
    url += `?${params.toString()}`;
    console.log("Request URL:", url);
  
    fetch(url)
      .then((response) => response.json())
      .then((data) => {
        console.log("Data returned from server:", data); // הדפסת תגובת השרת
        if (data.nodes && data.links) {
          setNetworkData(data);
        } else {
          setMessage("No data returned from server.");
          console.log("No nodes or links found in the response.");
        }
      })
      .catch((err) => {
        setMessage("An error occurred during network analysis.");
        console.error("Error during network analysis:", err);
      });
  };
  

  const filteredNodes = networkData
    ? networkData.nodes.filter((node) =>
        node.id.toLowerCase().includes(filter.toLowerCase())
      )
    : [];

  const filteredLinks = networkData
    ? networkData.links.filter(
        (link) =>
          filteredNodes.some((node) => node.id === link.source) &&
          filteredNodes.some((node) => node.id === link.target)
      )
    : [];

  return (
    <div className="container mt-5">
      <h2>Upload WhatsApp Chat File</h2>
      {message && (
        <Alert
          variant={message.includes("successfully") ? "success" : "danger"}
        >
          {message}
        </Alert>
      )}

      <Form onSubmit={handleSubmit}>
        <Form.Group controlId="formFile" className="mb-3">
          <Form.Label>Select WhatsApp Chat File</Form.Label>
          <Form.Control type="file" accept=".txt" onChange={handleFileChange} />
        </Form.Group>
        <Button variant="primary" type="submit">
          Upload
        </Button>
      </Form>

      {uploadedFile && (
        <div className="mt-3">
          <p>Uploaded File: {uploadedFile}</p>
          <div className="d-flex gap-3">
            <Button variant="danger" onClick={handleDelete}>
              Delete File
            </Button>
            <Button variant="info" onClick={handleAnalysis}>
              Show Word Analysis
            </Button>
          </div>

          <div className="mt-4 d-flex gap-3 align-items-center">
            <label>Start Date:</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="form-control"
            />
            <label>End Date:</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="form-control"
            />
            <Button variant="secondary" onClick={handleNetworkAnalysis}>
              Show Network Analysis
            </Button>
          </div>

 {/* Slider לבחירת מגבלת הודעות */}
 <div className="mt-3">
            <label>
              Limit Messages: <b>{messageLimit}</b>
            </label>
            <input
              type="range"
              min="10"
              max="500"
              step="10"
              value={messageLimit}
              onChange={(e) => setMessageLimit(e.target.value)}
              className="form-range"
            />
          </div>


          {networkData && (
            <div
              className="mt-4"
              style={{ height: "500px", border: "1px solid lightgray" }}
            >
              <h4>Social Network Analysis</h4>
              {/* <ForceGraph2D graphData={{ nodes: filteredNodes, links: filteredLinks }}
              nodeLabel={(node) => node.id} //יציג לי את השמות
              nodeAutoColorBy="id"
               /> */}
              <ForceGraph2D
                graphData={{ nodes: filteredNodes, links: filteredLinks }}
                nodeAutoColorBy="id" // צבע הצמתים לפי השם
                nodeCanvasObject={(node, ctx, globalScale) => {
                  const fontSize = 12 / globalScale; // גודל הפונט דינמי
                  ctx.save();
                  ctx.font = `${fontSize}px Sans-Serif`;
                  ctx.textAlign = "center";
                  ctx.textBaseline = "middle";
                  ctx.fillStyle = "black"; // צבע הטקסט
                  ctx.fillText(node.id, node.x, node.y + 10); // שם הצומת מתחת לנקודה
                  ctx.restore();
                }}
                nodeCanvasObjectMode={() => "after"} // מצייר טקסט אחרי הנקודה
                linkWidth={(link) => link.weight || 1} // עובי הקשת לפי המשקל
                linkColor={() => "gray"} // צבע ברירת מחדל לקווים
                linkCanvasObjectMode={() => "after"}
                linkCanvasObject={(link, ctx, globalScale) => {
                  const MAX_FONT_SIZE = 10;
                  const LABEL_OFFSET = 4;
                  const fontSize = Math.max(MAX_FONT_SIZE / globalScale, 6);

                  // צייר את הקו (במקרה וצריך לצייר ידנית)
                  ctx.save();
                  ctx.beginPath();
                  ctx.moveTo(link.source.x, link.source.y); // התחלה
                  ctx.lineTo(link.target.x, link.target.y); // יעד
                  ctx.strokeStyle = "gray";
                  ctx.lineWidth = link.weight || 1; // עובי לפי משקל
                  ctx.stroke();

                  // מציאת מרכז הקשת
                  const midX = (link.source.x + link.target.x) / 2;
                  const midY = (link.source.y + link.target.y) / 2;

                  // הצגת המשקל מעל הקשת
                  ctx.font = `${fontSize}px Sans-Serif`;
                  ctx.fillStyle = "black";
                  ctx.textAlign = "center";
                  ctx.textBaseline = "middle";
                  ctx.fillText(link.weight || 1, midX, midY - LABEL_OFFSET);

                  ctx.restore();
                }}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default UploadWhatsAppFile;
