
// import React, { useState } from 'react';
// import { Form, Button, Alert } from 'react-bootstrap';

// const UploadWhatsAppFile = () => {
//   const [file, setFile] = useState(null);
//   const [message, setMessage] = useState('');
//   const [uploadedFile, setUploadedFile] = useState(''); // סטייט לשם הקובץ

//   const handleFileChange = (event) => {
//     setFile(event.target.files[0]);
//     setMessage('');
//     setUploadedFile('');
//   };

//   const handleSubmit = (event) => {
//     event.preventDefault();

//     if (!file) {
//       setMessage('Please select a file before uploading.');
//       return;
//     }

//     const formData = new FormData();
//     formData.append('file', file);

//     fetch('http://localhost:8000/upload', {
//       method: 'POST',
//       body: formData,
//     })
//       .then((response) => response.json())
//       .then((data) => {
//         if (data.message) {
//           setMessage(data.message);
//           setUploadedFile(data.filename); // שמירת שם הקובץ שהועלה
//         }
//       })
//       .catch(() => setMessage('An error occurred during the upload.'));
//   };

//   const handleDelete = () => {
//     fetch(`http://localhost:8000/delete/${uploadedFile}`, { method: 'DELETE' })
//       .then((response) => response.json())
//       .then((data) => {
//         setMessage(data.message || 'File deleted successfully!');
//         setUploadedFile(''); // איפוס שם הקובץ
//       })
//       .catch(() => setMessage('An error occurred during the delete operation.'));
//   };

//   return (
//     <div className="container mt-5">
//       <h2>Upload WhatsApp Chat File</h2>
//       {message && <Alert variant={message.includes('successfully') ? 'success' : 'danger'}>{message}</Alert>}
//       <Form onSubmit={handleSubmit}>
//         <Form.Group controlId="formFile" className="mb-3">
//           <Form.Label>Select WhatsApp Chat File</Form.Label>
//           <Form.Control type="file" accept=".txt" onChange={handleFileChange} />
//         </Form.Group>
//         <Button variant="primary" type="submit">
//           Upload
//         </Button>
//       </Form>
//       {uploadedFile && (
//         <div className="mt-3">
//           <p>Uploaded File: {uploadedFile}</p>
//           <Button variant="danger" onClick={handleDelete}>
//             Delete File
//           </Button>
//         </div>
//       )}
//     </div>
//   );
// };

// export default UploadWhatsAppFile;


// ...................................................................................

// import React, { useState } from 'react';
// import { Form, Button, Alert } from 'react-bootstrap';
// import { Bar } from 'react-chartjs-2';

// const UploadWhatsAppFile = () => {
//   const [file, setFile] = useState(null);
//   const [message, setMessage] = useState('');
//   const [uploadedFile, setUploadedFile] = useState('');
//   const [chartData, setChartData] = useState(null);

//   // בחירת קובץ
//   const handleFileChange = (event) => {
//     setFile(event.target.files[0]);
//     setMessage('');
//     setUploadedFile('');
//     setChartData(null);
//   };

//   // העלאת קובץ
//   const handleSubmit = (event) => {
//     event.preventDefault();
//     if (!file) {
//       setMessage('Please select a file before uploading.');
//       return;
//     }

//     const formData = new FormData();
//     formData.append('file', file);

//     fetch('http://localhost:8000/upload', {
//       method: 'POST',
//       body: formData,
//     })
//       .then((response) => response.json())
//       .then((data) => {
//         if (data.message) {
//           setMessage(data.message);
//           setUploadedFile(data.filename);
//         }
//       })
//       .catch(() => setMessage('An error occurred during the upload.'));
//   };

//   // מחיקת קובץ
//   const handleDelete = () => {
//     fetch(`http://localhost:8000/delete/${uploadedFile}`, { method: 'DELETE' })
//       .then((response) => response.json())
//       .then((data) => {
//         setMessage(data.message || 'File deleted successfully!');
//         setUploadedFile('');
//         setChartData(null);
//       })
//       .catch(() => setMessage('An error occurred during the delete operation.'));
//   };

//   // ניתוח הקובץ
//   const handleAnalysis = () => {
//     fetch(`http://localhost:8000/analyze/${uploadedFile}`)
//       .then((response) => response.json())
//       .then((data) => {
//         if (data.analysis) {
//           const labels = Object.keys(data.analysis).slice(0, 10);
//           const counts = Object.values(data.analysis).slice(0, 10);
//           setChartData({
//             labels,
//             datasets: [
//               {
//                 label: 'Word Frequency',
//                 data: counts,
//                 backgroundColor: 'rgba(75,192,192,0.6)',
//               },
//             ],
//           });
//         }
//       })
//       .catch(() => setMessage('An error occurred during analysis.'));
//   };

//   return (
//     <div className="container mt-5">
//       <h2>Upload WhatsApp Chat File</h2>
//       {message && <Alert variant={message.includes('successfully') ? 'success' : 'danger'}>{message}</Alert>}
//       <Form onSubmit={handleSubmit}>
//         <Form.Group controlId="formFile" className="mb-3">
//           <Form.Label>Select WhatsApp Chat File</Form.Label>
//           <Form.Control type="file" accept=".txt" onChange={handleFileChange} />
//         </Form.Group>
//         <Button variant="primary" type="submit">
//           Upload
//         </Button>
//       </Form>

//       {uploadedFile && (
//         <div className="mt-3">
//           <p>Uploaded File: {uploadedFile}</p>
//           <div className="d-flex gap-3">
//             <Button variant="danger" onClick={handleDelete}>
//               Delete File
//             </Button>
//             <Button variant="info" onClick={handleAnalysis}>
//               Show Analysis
//             </Button>
//           </div>
//           {chartData && (
//             <div className="mt-4">
//               <h4>Word Frequency Analysis</h4>
//               <Bar data={chartData} />
//             </div>
//           )}
//         </div>
//       )}
//     </div>
//   );
// };

// export default UploadWhatsAppFile;

import React, { useState } from 'react';
import { Form, Button, Alert } from 'react-bootstrap';
import { Bar } from 'react-chartjs-2';
import { ForceGraph2D } from 'react-force-graph';


const UploadWhatsAppFile = () => {
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState('');
  const [uploadedFile, setUploadedFile] = useState('');
  const [chartData, setChartData] = useState(null);
  const [networkData, setNetworkData] = useState(null);

  // בחירת קובץ
  const handleFileChange = (event) => {
    setFile(event.target.files[0]);
    setMessage('');
    setUploadedFile('');
    setChartData(null);
    setNetworkData(null);
  };

  // העלאת קובץ
  const handleSubmit = (event) => {
    event.preventDefault();
    if (!file) {
      setMessage('Please select a file before uploading.');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    fetch('http://localhost:8000/upload', {
      method: 'POST',
      body: formData,
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.message) {
          setMessage(data.message);
          setUploadedFile(data.filename);
        }
      })
      .catch(() => setMessage('An error occurred during the upload.'));
  };

  // מחיקת קובץ
  const handleDelete = () => {
    fetch(`http://localhost:8000/delete/${uploadedFile}`, { method: 'DELETE' })
      .then((response) => response.json())
      .then((data) => {
        setMessage(data.message || 'File deleted successfully!');
        setUploadedFile('');
        setChartData(null);
        setNetworkData(null);
      })
      .catch(() => setMessage('An error occurred during the delete operation.'));
  };

  // ניתוח Word Frequency
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
                label: 'Word Frequency',
                data: counts,
                backgroundColor: 'rgba(75,192,192,0.6)',
              },
            ],
          });
        }
      })
      .catch(() => setMessage('An error occurred during analysis.'));
  };

  // ניתוח רשת (Network Graph)
  const handleNetworkAnalysis = () => {
    fetch(`http://localhost:8000/analyze/network/${uploadedFile}`)
      .then((response) => response.json())
      .then((data) => {
        if (data.nodes && data.links) {
          setNetworkData(data);
        }
      })
      .catch(() => setMessage('An error occurred during network analysis.'));
  };

  return (
    <div className="container mt-5">
      <h2>Upload WhatsApp Chat File</h2>
      {message && <Alert variant={message.includes('successfully') ? 'success' : 'danger'}>{message}</Alert>}

      {/* טופס העלאת קובץ */}
      <Form onSubmit={handleSubmit}>
        <Form.Group controlId="formFile" className="mb-3">
          <Form.Label>Select WhatsApp Chat File</Form.Label>
          <Form.Control type="file" accept=".txt" onChange={handleFileChange} />
        </Form.Group>
        <Button variant="primary" type="submit">
          Upload
        </Button>
      </Form>

      {/* אפשרויות ניתוח ומחיקה */}
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
            <Button variant="secondary" onClick={handleNetworkAnalysis}>
              Show Network Analysis
            </Button>
          </div>

          {/* גרף Word Frequency */}
          {chartData && (
            <div className="mt-4">
              <h4>Word Frequency Analysis</h4>
              <Bar data={chartData} />
            </div>
          )}

          {/* גרף Network Graph */}
          {networkData && (
            <div className="mt-4" style={{ height: '500px', border: '1px solid lightgray' }}>
              <h4>Social Network Analysis</h4>
              <ForceGraph2D
                graphData={networkData}
                nodeAutoColorBy="id"
                linkDirectionalArrowLength={3.5}
                linkDirectionalArrowRelPos={1}
                nodeCanvasObject={(node, ctx, globalScale) => {
                  const label = node.id;
                  const fontSize = 12 / globalScale;
                  ctx.font = `${fontSize}px Sans-Serif`;
                  ctx.textAlign = 'center';
                  ctx.textBaseline = 'middle';
                  ctx.fillStyle = 'black';
                  ctx.fillText(label, node.x, node.y);
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
