import React, { useState, useRef, useEffect } from "react";
import { Bar } from "react-chartjs-2";
import { Container, Row, Col, Form, Button, Card } from "react-bootstrap";
import {
  Upload,
  Save,
  Trash,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
} from "react-bootstrap-icons";
import { ForceGraph2D } from "react-force-graph";
import "./Home.css";

// Import custom styles
import { AlertBox, GraphContainer } from "./Form.style.js";

const Home = () => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState(null);
  const fileInputRef = useRef(null);
  const [message, setMessage] = useState("");
  const [uploadedFile, setUploadedFile] = useState("");
  const [chartData, setChartData] = useState(null);
  const [networkData, setNetworkData] = useState(null);
  const [filter, setFilter] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [messageLimit, setMessageLimit] = useState(50);
  const [messageLength, setMessageLength] = useState(100);
  const [responseTime, setResponseTime] = useState(30);
  const [keywords, setKeywords] = useState("");
  const [inputKey, setInputKey] = useState(Date.now());
  const [showFilters, setShowFilters] = useState(true);
  const [showMetrics, setShowMetrics] = useState(true);
  const forceGraphRef = useRef(null);
  const [showDegree, setShowDegree] = useState(false);

  const graphMetrics = [
    "Degree",
    "Betweenness",
    "Closeness",
    "Density",
    "Diameter",
    "Metrics",
  ];

  useEffect(() => {
    if (!uploadedFile) {
      setFile(null);
      setChartData(null);
      setNetworkData(null);
      setFilter("");
      setStartDate("");
      setEndDate("");
      setMessageLimit(50);
      setMessageLength(100);
      setResponseTime(30);
      setKeywords("");
      setInputKey(Date.now());
      if (forceGraphRef.current) {
        forceGraphRef.current.zoomToFit(400, 100);
      }
    }
  }, [uploadedFile, showMetrics]);

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];

    if (!selectedFile) return;

    setFile(selectedFile);
    setUploadedFile("");
    setChartData(null);
    setNetworkData(null);
    setMessage("");

    handleSubmit(selectedFile);
  };

  const handleUploadClick = () => {
    fileInputRef.current.click();
  };
  const handleInputChange = (setter) => (e) => {
    setter(e.target.value);
  };
  const handleSubmit = (selectedFile) => {
    if (!selectedFile) {
      setMessage("Please select a file before uploading.");
      return;
    }

    const formData = new FormData();
    formData.append("file", selectedFile);

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

  const handleDelete = async () => {
    if (!uploadedFile) {
      setMessage("No file selected to delete.");
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:8000/delete/${uploadedFile}`,
        { method: "DELETE" }
      );
      const data = await response.json();

      if (data.success) {
        setMessage(data.message || "File deleted successfully!");
        setUploadedFile("");
        setFile(null);
        setChartData(null);
        setNetworkData(null);
        setFilter("");
        setStartDate("");
        setEndDate("");
        setMessageLimit(50);
        setMessageLength(100);
        setResponseTime(30);
        setKeywords("");
        setInputKey(Date.now());
      } else {
        setMessage("Error: Could not delete the file.");
      }
    } catch (error) {
      setMessage("An error occurred during the delete operation.");
    }
  };

  const handleNetworkAnalysis = () => {
    let url = `http://localhost:8000/analyze/network/${uploadedFile}`;

    const params = new URLSearchParams();
    if (startDate) params.append("start_date", startDate);
    if (endDate) params.append("end_date", endDate);
    if (messageLimit) params.append("limit", messageLimit);

    url += `?${params.toString()}`;
    console.log("Request URL:", url);

    fetch(url)
      .then((response) => response.json())
      .then((data) => {
        console.log("Data returned from server:", data);
        if (data.nodes && data.links) {
          setNetworkData(data);
        } else {
          setMessage("No data returned from server.");
        }
      })
      .catch((err) => {
        setMessage("An error occurred during network analysis.");
        console.error("Error during network analysis:", err);
      });
  };

  const handleSaveToDB = () => {
    if (!name || !description) {
      setMessage("Please fill in all required fields.");
      return;
    }

    const formData = {
      name,
      description,
      start_date: startDate,
      end_date: endDate,
      message_limit: messageLimit,
    };

    fetch("http://localhost:8001/save-form", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(formData),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.message) {
          setMessage(data.message);
        }
      })
      .catch(() => setMessage("An error occurred while saving the form."));
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
    <Container fluid className="upload-section">
      {/* Research Upload */}
      <Card onSubmit={handleSubmit} className="research-card">
        <Form>
          <Row className="align-items-center justify-content-between">
            <Col>
              <h4 className="fw-bold">New Research</h4>
            </Col>

            <Col className="text-end">
              <Button className="action-btn me-2">
                <Save size={16} /> Save
              </Button>
              <Button onClick={handleDelete} className="action-btn delete-btn">
                <Trash size={16} /> Delete File
              </Button>
            </Col>
          </Row>

          <Row className="mt-3 align-items-center">
            <Col lg={8} md={12}>
              <Form.Group className="mb-3">
                <Form.Label className="research-label">
                  Research Name:
                </Form.Label>
                <Form.Control
                  type="text"
                  id="name"
                  value={name}
                  placeholder="Enter the name of your research"
                  onChange={(e) => setName(e.target.value)}
                  className="research-input"
                />
              </Form.Group>
              <Form.Group>
                <Form.Label className="research-label">Description:</Form.Label>
                <Form.Control
                  type="text"
                  id="description"
                  value={description}
                  placeholder="Enter a short description"
                  onChange={(e) => setDescription(e.target.value)}
                  className="research-input"
                />
              </Form.Group>
            </Col>
            <Col
              lg={4}
              md={12}
              className="d-flex flex-column align-items-center mt-3 mt-lg-0"
            >
              <Button className="upload-btn" onClick={handleUploadClick}>
                <Upload size={16} /> Upload File
              </Button>
              <Form.Control
                type="file"
                accept=".txt"
                ref={fileInputRef}
                onChange={handleFileChange}
                key={inputKey}
                style={{ display: "none" }}
              />

              {/* {file && <p className="mt-2">Selected File: {file.name}</p>} */}
              {message && (
                <AlertBox success={message.includes("successfully")}>
                  {message}
                </AlertBox>
              )}
            </Col>
          </Row>
        </Form>
      </Card>

      {/* Research Filters */}
      {uploadedFile && (
        <div>
          <Card className="research-card">
            <h4 className="fw-bold d-flex justify-content-between align-items-center">
              Research Filters
              <Button
                variant="link"
                className="toggle-btn"
                onClick={() => setShowFilters(!showFilters)}
              >
                {showFilters ? (
                  <ChevronUp size={20} />
                ) : (
                  <ChevronDown size={20} />
                )}
              </Button>
            </h4>
            {showFilters && (
              <div>
                <Row className="mt-3">
                  <Col lg={4} md={4} className="mb-3">
                    <Form.Group>
                      <Form.Label className="research-label">
                        From Date:
                      </Form.Label>
                      <Form.Control
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="research-input"
                      />
                    </Form.Group>
                  </Col>
                  <Col lg={4} md={4} className="mb-3">
                    <Form.Group>
                      <Form.Label className="research-label">
                        To Date:
                      </Form.Label>
                      <Form.Control
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="research-input"
                      />
                    </Form.Group>
                  </Col>
                  <Col lg={4} md={4} className="mb-3">
                    <Form.Group>
                      <Form.Label className="research-label">
                        Message Limit:
                      </Form.Label>
                      <Form.Control
                        type="number"
                        min="1"
                        max="100"
                        value={messageLimit}
                        onChange={handleInputChange(setMessageLimit)}
                        className="research-input"
                      />
                    </Form.Group>
                  </Col>
                </Row>
                <Row className="mt-3">
                  <Col lg={4} md={4} className="mb-3">
                    <Form.Group>
                      <Form.Label className="research-label">
                        Message Length (Characters):
                      </Form.Label>
                      <Form.Control
                        type="number"
                        min="10"
                        max="1000"
                        value={messageLength}
                        onChange={handleInputChange(setMessageLength)}
                        className="research-input"
                      />
                    </Form.Group>
                  </Col>

                  <Col lg={4} md={4} className="mb-3">
                    <Form.Group>
                      <Form.Label className="research-label">
                        Response Time (Seconds):
                      </Form.Label>
                      <Form.Control
                        type="number"
                        min="1"
                        max="300"
                        value={responseTime}
                        onChange={handleInputChange(setResponseTime)}
                        className="research-input"
                      />
                    </Form.Group>
                  </Col>
                  <Col lg={4} md={4} className="mb-3">
                    <Form.Group>
                      <Form.Label className="research-label">
                        Keywords:
                      </Form.Label>
                      <Form.Control
                        type="text"
                        value={keywords}
                        onChange={handleInputChange(setKeywords)}
                        placeholder="Enter keywords, separated by commas"
                        className="research-input"
                      />
                    </Form.Group>
                  </Col>
                </Row>
                <Row className="align-items-center justify-content-between">
                  <Col>
                    <Button
                      onClick={handleNetworkAnalysis}
                      className="filter-btn"
                    >
                      Apply Filters
                    </Button>
                  </Col>
                </Row>
              </div>
            )}
          </Card>

          {uploadedFile && (
            <Row className="mt-4">
              <Col
                lg={3}
                md={12}
                className={`mb-3 metrics-panel ${
                  showMetrics ? "open" : "closed"
                }`}
              >
                <Card className="metrics-card">
                  <h4 className="fw-bold d-flex justify-content-between align-items-center">
                    {showMetrics && "Graph Metrics"}
                    <Button
                      variant="link"
                      className="metrics-toggle"
                      onClick={() => setShowMetrics(!showMetrics)}
                    >
                      {showMetrics ? (
                        <ChevronLeft size={20} />
                      ) : (
                        <ChevronRight size={20} />
                      )}
                    </Button>
                  </h4>
                  {showMetrics && (
                    <div className="mt-2">
                      {graphMetrics.map((metric, index) => (
                        <Button
                          key={index}
                          className={`metrics-item ${
                            metric === "Degree" && showDegree ? "active" : ""
                          }`}
                          onClick={
                            metric === "Degree" ? handleDegreeMetric : null
                          }
                        >
                          {metric}
                        </Button>
                      ))}
                    </div>
                  )}
                </Card>
              </Col>

              {/* Graph Display */}
              <Col lg={9} md={12} className="graph-area">
                <Card className="graph-card">
                  {/* <span
                      className="position-absolute top-0 end-0 p-2 text-muted"
                      style={{ cursor: "pointer" }}>
                      Save
                    </span> */}
                  <div className="graph-placeholder">
                    {networkData && (
                      <GraphContainer>
                        <ForceGraph2D
                          key={showMetrics}
                          graphData={{
                            nodes: filteredNodes,
                            links: filteredLinks,
                          }}
                          width={showMetrics ? 1200 : 1500}
                          height={500}
                          fitView
                          fitViewPadding={20}
                          nodeAutoColorBy="id"
                          linkWidth={(link) => Math.sqrt(link.weight || 1)}
                          linkColor={() => "gray"}
                          linkCanvasObject={(link, ctx, globalScale) => {
                            ctx.beginPath();
                            ctx.moveTo(link.source.x, link.source.y);
                            ctx.lineTo(link.target.x, link.target.y);
                            ctx.strokeStyle = "gray";
                            ctx.lineWidth = Math.sqrt(link.weight || 1);
                            ctx.stroke();

                            const midX = (link.source.x + link.target.x) / 2;
                            const midY = (link.source.y + link.target.y) / 2;
                            const fontSize = 10 / globalScale;
                            ctx.save();
                            ctx.font = `${fontSize}px Sans-Serif`;
                            ctx.fillStyle = "black";
                            ctx.textAlign = "center";
                            ctx.textBaseline = "middle";
                            ctx.fillText(link.weight || "1", midX, midY);
                            ctx.restore();
                          }}
                          nodeCanvasObject={(node, ctx, globalScale) => {
                            const fontSize = 12 / globalScale;
                            const radius = 8;
                            ctx.save();

                            ctx.beginPath();
                            ctx.arc(
                              node.x,
                              node.y,
                              radius,
                              0,
                              2 * Math.PI,
                              false
                            );
                            ctx.fillStyle = node.color || "blue";
                            ctx.fill();

                            ctx.font = `${fontSize}px Sans-Serif`;
                            ctx.textAlign = "center";
                            ctx.textBaseline = "middle";
                            ctx.fillStyle = "black";
                            ctx.fillText(node.id, node.x, node.y + radius + 12);

                            if (showDegree) {
                              ctx.fillStyle = "DarkBlue";
                              ctx.fillText(
                                `Deg: ${node.degree}`,
                                node.x,
                                node.y + radius + 40
                              );
                            }

                            ctx.restore();
                          }}
                        />
                      </GraphContainer>
                    )}
                  </div>
                </Card>
              </Col>
            </Row>
          )}
        </div>
      )}
    </Container>
  );
};

export default Home;
