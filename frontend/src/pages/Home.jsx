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
  const [showDegree, setShowDegree] = useState(false);
  const [showBetweenness, setShowBetweenness] = useState(false);
  const [showCloseness, setShowCloseness] = useState(false);
  const [showDensity, setShowDensity] = useState(false);
  const [densityValue, setDensityValue] = useState(0);
  const [showDiameter, setShowDiameter] = useState(false);
  const [diameterValue, setDiameterValue] = useState(0);
  const forceGraphRef = useRef(null);

  const graphMetrics = [
    "Degree",
    "Betweenness",
    "Closeness",
    "Density",
    "Diameter",
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

  const calculateNodeDegree = (nodes, links) => {
    const degreeMap = {};
    nodes.forEach((node) => (degreeMap[node.id] = 0));
    links.forEach((link) => {
      degreeMap[link.source] += 1;
      degreeMap[link.target] += 1;
    });
    return nodes.map((node) => ({ ...node, degree: degreeMap[node.id] || 0 }));
  };

  const handleDegreeMetric = () => {
    setShowDegree(!showDegree);
    if (!showDegree && networkData) {
      const updatedNodes = calculateNodeDegree(
        networkData.nodes,
        networkData.links
      );
      setNetworkData({ nodes: updatedNodes, links: networkData.links });
    }
  };

  const handleBetweennessMetric = () => {
    setShowBetweenness(!showBetweenness);

    if (!showBetweenness && networkData) {
      const updatedNodes = networkData.nodes.map((node) => ({
        ...node,
        betweenness: node.betweenness || 0,
        degree: node.degree || 0,
      }));

      setNetworkData((prevData) => ({
        nodes: updatedNodes,
        links: prevData.links,
      }));
    }
  };

  const calculateCloseness = (nodes, links) => {
    const distances = {};
    nodes.forEach((node) => {
      distances[node.id] = {};
      nodes.forEach(
        (n) => (distances[node.id][n.id] = node.id === n.id ? 0 : Infinity)
      );
    });

    links.forEach((link) => {
      distances[link.source][link.target] = 1;
      distances[link.target][link.source] = 1;
    });

    nodes.forEach((k) => {
      nodes.forEach((i) => {
        nodes.forEach((j) => {
          if (
            distances[i.id][j.id] >
            distances[i.id][k.id] + distances[k.id][j.id]
          ) {
            distances[i.id][j.id] =
              distances[i.id][k.id] + distances[k.id][j.id];
          }
        });
      });
    });

    return nodes.map((node) => {
      const sumDistances = Object.values(distances[node.id]).reduce(
        (a, b) => a + (b !== Infinity ? b : 0),
        0
      );
      const closeness = sumDistances > 0 ? 1 / sumDistances : 0;
      return { ...node, closeness };
    });
  };

  const handleClosenessMetric = () => {
    setShowCloseness(!showCloseness);
    if (!showCloseness && networkData) {
      const updatedNodes = calculateCloseness(
        networkData.nodes,
        networkData.links
      );
      setNetworkData({ nodes: updatedNodes, links: networkData.links });
    }
  };

  const handleDensityMetric = () => {
    setShowDensity(!showDensity);
    if (!showDensity && networkData) {
      const density = calculateDensity(networkData.nodes, networkData.links);
      setDensityValue(density.toFixed(4));
    }
  };

  const calculateDensity = (nodes, links) => {
    const n = nodes.length;
    const m = links.length;
    if (n <= 1) return 0;
    return (2 * m) / (n * (n - 1));
  };

  const calculateDiameter = (nodes, links) => {
    const distances = {};
    nodes.forEach((node) => {
      distances[node.id] = {};
      nodes.forEach(
        (n) => (distances[node.id][n.id] = node.id === n.id ? 0 : Infinity)
      );
    });

    links.forEach((link) => {
      distances[link.source][link.target] = 1;
      distances[link.target][link.source] = 1;
    });

    nodes.forEach((k) => {
      nodes.forEach((i) => {
        nodes.forEach((j) => {
          if (
            distances[i.id][j.id] >
            distances[i.id][k.id] + distances[k.id][j.id]
          ) {
            distances[i.id][j.id] =
              distances[i.id][k.id] + distances[k.id][j.id];
          }
        });
      });
    });

    let maxDistance = 0;
    nodes.forEach((i) => {
      nodes.forEach((j) => {
        if (distances[i.id][j.id] !== Infinity) {
          maxDistance = Math.max(maxDistance, distances[i.id][j.id]);
        }
      });
    });

    return maxDistance;
  };

  const handleDiameterMetric = () => {
    setShowDiameter(!showDiameter);
    if (!showDiameter && networkData) {
      const diameter = calculateDiameter(networkData.nodes, networkData.links);
      setDiameterValue(diameter);
    }
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
                      {graphMetrics.map((metric) => (
                        <Button
                          key={metric}
                          className={`metrics-item ${
                            (metric === "Degree" && showDegree) ||
                            (metric === "Betweenness" && showBetweenness) ||
                            (metric === "Closeness" && showCloseness) ||
                            (metric === "Density" && showDensity) ||
                            (metric === "Diameter" && showDiameter)
                              ? "active"
                              : ""
                          }`}
                          onClick={() => {
                            if (metric === "Degree") handleDegreeMetric();
                            if (metric === "Betweenness")
                              handleBetweennessMetric();
                            if (metric === "Closeness") handleClosenessMetric();
                            if (metric === "Density") handleDensityMetric();
                            if (metric === "Diameter") handleDiameterMetric();
                          }}
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
                {(showDensity || showDiameter) && (
                  <Card className="density-card">
                    {showDensity && (
                      <h5 className="fw-bold">Graph Density: {densityValue}</h5>
                    )}
                    {showDiameter && (
                      <h5 className="fw-bold">
                        Graph Diameter: {diameterValue}
                      </h5>
                    )}
                  </Card>
                )}

                <Card className="graph-card">
                  {/* <span
                    className="position-absolute top-0 end-0 p-2 text-muted"
                    style={{ cursor: "pointer" }}
                  >
                    Save{" "}
                  </span> */}
                  <div className="graph-placeholder">
                    {networkData && (
                      <GraphContainer>
                        <ForceGraph2D
                          key={
                            showDegree ||
                            showBetweenness ||
                            showCloseness ||
                            showDensity ||
                            showDiameter
                          }
                          graphData={{
                            nodes: filteredNodes,
                            links: filteredLinks.map((link) => ({
                              source:
                                filteredNodes.find(
                                  (node) =>
                                    node.id === link.source.id ||
                                    node.id === link.source
                                ) || link.source,
                              target:
                                filteredNodes.find(
                                  (node) =>
                                    node.id === link.target.id ||
                                    node.id === link.target
                                ) || link.target,
                            })),
                          }}
                          width={showMetrics ? 1200 : 1500}
                          height={500}
                          fitView
                          fitViewPadding={20}
                          nodeAutoColorBy="id"
                          linkWidth={(link) => Math.sqrt(link.weight || 1)}
                          linkColor={() => "gray"}
                          enableNodeDrag={true}
                          cooldownTicks={100}
                          d3AlphaDecay={0.03}
                          d3VelocityDecay={0.2}
                          onEngineStop={() =>
                            forceGraphRef.current?.zoomToFit(400, 100)
                          }
                          linkCanvasObject={(link, ctx, globalScale) => {
                            if (!link.source || !link.target) return;
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
                            const radius = showCloseness
                              ? Math.max(5, node.closeness * 200)
                              : showBetweenness
                              ? Math.max(5, node.betweenness * 20)
                              : showDegree
                              ? Math.max(5, node.degree * 5)
                              : 8;

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
                            ctx.fillStyle = showCloseness
                              ? "green"
                              : showBetweenness
                              ? "red"
                              : showDegree
                              ? "#231d81"
                              : node.color || "blue";
                            ctx.fill();

                            ctx.font = `${fontSize}px Sans-Serif`;
                            ctx.textAlign = "center";
                            ctx.textBaseline = "middle";
                            ctx.fillStyle = "black";
                            ctx.fillText(node.id, node.x, node.y + radius + 12);

                            if (showDegree) {
                              ctx.fillStyle = "#231d81";
                              ctx.fillText(
                                `Deg: ${node.degree}`,
                                node.x,
                                node.y + radius + 20
                              );
                            }
                            if (showBetweenness) {
                              ctx.fillStyle = "DarkRed";
                              ctx.fillText(
                                `Btw: ${node.betweenness.toFixed(2)}`,
                                node.x,
                                node.y + radius + 35
                              );
                            }
                            if (showCloseness) {
                              ctx.fillStyle = "green";
                              ctx.fillText(
                                `Cls: ${node.closeness.toFixed(2)}`,
                                node.x,
                                node.y + radius + 50
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
