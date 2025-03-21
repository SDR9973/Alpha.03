
// import React, { useState } from "react";
// import { Alert, Form, Button } from "react-bootstrap";

// const WikipediaDataFetcher = ({ setNetworkData, setWikiUrl }) => {
//   const [localWikiUrl, setLocalWikiUrl] = useState("");
//   const [message, setMessage] = useState("");
//   const [loading, setLoading] = useState(false);

//   const handleFetchData = async () => {
//     if (!localWikiUrl.trim()) {
//       setMessage(" Please enter a Wikipedia discussion page URL.");
//       return;
//     }

//     setWikiUrl(localWikiUrl); 
//     setLoading(true);

//     try {
//       const response = await fetch("http://localhost:8001/fetch-wikipedia-data", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ url: localWikiUrl }),
//       });

//       if (!response.ok) {
//         throw new Error(`Server error: ${response.status}`);
//       }

//       const data = await response.json();
//       console.log("Fetched Wikipedia Data:", data);

//       if (data.nodes && data.links) {
//         setNetworkData(data);
//         setMessage(" Data successfully loaded!");
//       } else {
//         setMessage("⚠️ No valid discussion data found on this Wikipedia page.");
//       }
//     } catch (error) {
//       console.error("Error loading Wikipedia data:", error);
//       setMessage(` Server connection error: ${error.message}`);
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div>
//       {message && (
//         <Alert variant={message.includes("successfully") ? "success" : "danger"}>
//           {message}
//         </Alert>
//       )}

//       <Form.Group>
//         <Form.Label>Wikipedia Discussion Page URL:</Form.Label>
//         <Form.Control
//           type="text"
//           value={localWikiUrl}
//           onChange={(e) => setLocalWikiUrl(e.target.value)}
//           placeholder="Example: https://en.wikipedia.org/wiki/Talk:Jerusalem"
//         />
//       </Form.Group>
//       <Button onClick={handleFetchData} disabled={loading}>
//         {loading ? "Loading..." : "Upload Wikipedia Link"}
//       </Button>
//     </div>
//   );
// };

// export default WikipediaDataFetcher;




// Updated WikipediaDataFetcher component
import React, { useState } from "react";
import { Alert, Form, Button } from "react-bootstrap";

const WikipediaDataFetcher = ({ setNetworkData, setWikiUrl }) => {
  const [localWikiUrl, setLocalWikiUrl] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleFetchData = async () => {
    if (!localWikiUrl.trim()) {
      setMessage("⚠️ Please enter a Wikipedia discussion page URL.");
      return;
    }

    setWikiUrl(localWikiUrl); // Update parent component with the URL
    setLoading(true);

    try {
      const response = await fetch("http://localhost:8001/fetch-wikipedia-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: localWikiUrl }),
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const data = await response.json();
      console.log("Fetched Wikipedia Data:", data);

      if (data.nodes && data.links && data.nodes.length > 0) {
        // Process the data to ensure compatibility with ForceGraph2D
        const processedData = {
          nodes: data.nodes.map(node => ({
            ...node,
            id: String(node.id) // Ensure ID is a string
          })),
          links: data.links.map(link => ({
            ...link,
            source: String(link.source), // Ensure source is a string
            target: String(link.target)  // Ensure target is a string
          }))
        };
        
        setNetworkData(processedData); // Send processed data to HomeW
        setMessage(" Data successfully loaded!");
      } else {
        setMessage(" No valid discussion data found on this Wikipedia page.");
      }
    } catch (error) {
      console.error("Error loading Wikipedia data:", error);
      setMessage(` Server connection error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="wiki-fetcher-container">
      {message && (
        <Alert variant={message.includes("successfully") ? "success" : "danger"}>
          {message}
        </Alert>
      )}

      <Form.Group>
        <Form.Label>Wikipedia Discussion Page URL:</Form.Label>
        <Form.Control
          type="text"
          value={localWikiUrl}
          onChange={(e) => setLocalWikiUrl(e.target.value)}
          placeholder="Example: https://en.wikipedia.org/wiki/Talk:Jerusalem"
        />
      </Form.Group>
      <Button 
        onClick={handleFetchData} 
        disabled={loading}
        className="mt-2 mb-3 w-100"
      >
        {loading ? "Loading..." : "Upload Wikipedia Link"}
      </Button>
    </div>
  );
};

export default WikipediaDataFetcher;