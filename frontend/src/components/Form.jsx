// import React, { useState } from 'react';
// import { Form, Button, Alert } from 'react-bootstrap';

// const UploadWhatsAppFile = () => {
//   const [file, setFile] = useState(null);
//   const [message, setMessage] = useState('');

//   const handleFileChange = (event) => {
//     setFile(event.target.files[0]);
//     setMessage('');
//   };

//   const handleSubmit = (event) => {
//     event.preventDefault();

//     if (!file) {
//       setMessage('Please select a file before uploading.');
//       return;
//     }

//     const formData = new FormData();
//     formData.append('file', file);

//     // שליחת הקובץ לשרת באמצעות fetch
//     fetch('http://localhost:8000/upload', {
//       method: 'POST',
//       body: formData,
//     })
//       .then((response) => {
//         if (response.ok) {
//           setMessage('File uploaded successfully!');
//         } else {
//           setMessage('File upload failed. Please try again.');
//         }
//       })
//       .catch(() => {
//         setMessage('An error occurred during the upload.');
//       });
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
//     </div>
//   );
// };

// export default UploadWhatsAppFile;


import React, { useState } from 'react';
import { Form, Button, Alert } from 'react-bootstrap';

const UploadWhatsAppFile = () => {
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState('');
  const [uploadedFile, setUploadedFile] = useState(''); // סטייט לשם הקובץ

  const handleFileChange = (event) => {
    setFile(event.target.files[0]);
    setMessage('');
    setUploadedFile('');
  };

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
          setUploadedFile(data.filename); // שמירת שם הקובץ שהועלה
        }
      })
      .catch(() => setMessage('An error occurred during the upload.'));
  };

  const handleDelete = () => {
    fetch(`http://localhost:8000/delete/${uploadedFile}`, { method: 'DELETE' })
      .then((response) => response.json())
      .then((data) => {
        setMessage(data.message || 'File deleted successfully!');
        setUploadedFile(''); // איפוס שם הקובץ
      })
      .catch(() => setMessage('An error occurred during the delete operation.'));
  };

  return (
    <div className="container mt-5">
      <h2>Upload WhatsApp Chat File</h2>
      {message && <Alert variant={message.includes('successfully') ? 'success' : 'danger'}>{message}</Alert>}
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
          <Button variant="danger" onClick={handleDelete}>
            Delete File
          </Button>
        </div>
      )}
    </div>
  );
};

export default UploadWhatsAppFile;
