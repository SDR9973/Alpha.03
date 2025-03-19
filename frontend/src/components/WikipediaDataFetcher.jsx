// import React, { useState, useEffect } from "react";
// import { Alert, Form, Button } from "react-bootstrap";

// const WikipediaDataFetcher = ({ setNetworkData }) => {
//   const [wikiUrl, setWikiUrl] = useState("");
//   const [message, setMessage] = useState("");
//   const [loading, setLoading] = useState(false);

//   const handleFetchData = async () => {
//     if (!wikiUrl) {
//       setMessage("❌ Please enter a Wikipedia discussion page URL.");
//       return;
//     }

//     setLoading(true);
//     try {
//       const response = await fetch(
//         "http://localhost:8001/fetch-wikipedia-data",
//         {
//           method: "POST",
//           headers: { "Content-Type": "application/json" },
//           body: JSON.stringify({ url: wikiUrl }),
//         }
//       );

//       if (!response.ok) {
//         throw new Error(`Server error: ${response.status}`);
//       }

//       const data = await response.json();
//       console.log("Fetched Wikipedia Data:", data);

//       if (data.nodes && data.links) {
//         setNetworkData(data); // 🔹 Send data to `HomeW.jsx`
//         setMessage(" Data successfully loaded!");
//       } else {
//         setMessage("No valid discussion data found on this Wikipedia page.");
//       }
//     } catch (error) {
//       console.error(" Error loading Wikipedia data:", error);
//       setMessage(` Server connection error: ${error.message}`);
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div>
//       {message && (
//   <Alert variant={message.includes("successfully") ? "success" : "danger"}>
//     {message}
//   </Alert>
// )}

//       <Form.Group>
//         <Form.Label>Wikipedia Discussion Page URL:</Form.Label>
//         <Form.Control
//           type="text"
//           value={wikiUrl}
//           onChange={(e) => setWikiUrl(e.target.value)}
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


import React, { useState } from "react";
import { Alert, Form, Button } from "react-bootstrap";

const WikipediaDataFetcher = ({ setNetworkData, setWikiUrl }) => {
  const [localWikiUrl, setLocalWikiUrl] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleFetchData = async () => {
    if (!localWikiUrl.trim()) {
      setMessage(" Please enter a Wikipedia discussion page URL.");
      return;
    }

    setWikiUrl(localWikiUrl); // ✅ Updates HomeW with the wikiUrl
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

      if (data.nodes && data.links) {
        setNetworkData(data); // ✅ Send data to `HomeW.jsx`
        setMessage(" Data successfully loaded!");
      } else {
        setMessage("⚠️ No valid discussion data found on this Wikipedia page.");
      }
    } catch (error) {
      console.error("Error loading Wikipedia data:", error);
      setMessage(` Server connection error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
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
      <Button onClick={handleFetchData} disabled={loading}>
        {loading ? "Loading..." : "Upload Wikipedia Link"}
      </Button>
    </div>
  );
};

export default WikipediaDataFetcher;
