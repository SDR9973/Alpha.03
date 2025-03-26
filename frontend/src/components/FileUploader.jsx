// src/components/FileUploader.jsx
import React, { useState, useRef } from 'react';
import { Card, Button, ProgressBar, Alert, Form } from 'react-bootstrap';
import { Upload, Trash } from 'react-bootstrap-icons';
import { useFiles } from '../hooks/useFiles';

/**
 * FileUploader component for handling file uploads
 * including WhatsApp chat files and other file types
 *
 * @param {Function} onUploadComplete - Callback function when upload completes
 * @param {Function} onDeleteComplete - Callback function when file is deleted
 * @param {string} fileType - Type of file to accept (default: .txt)
 * @param {string} uploadEndpoint - API endpoint for upload (default: regular file upload)
 */
const FileUploader = ({
  onUploadComplete,
  onDeleteComplete,
  fileType = '.txt',
  uploadEndpoint = 'regular'
}) => {
  const {
    uploadFile,
    uploadChatFile,
    deleteFile,
    uploadProgress,
    status,
    error,
    clearError,
    isUploading,
    isDeleting
  } = useFiles();

  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [localError, setLocalError] = useState('');
  const fileInputRef = useRef(null);

  // Handle file selection
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Reset states
    setLocalError('');
    clearError();
    setSelectedFile(file);
  };

  // Trigger file input click
  const handleSelectFileClick = () => {
    fileInputRef.current.click();
  };

  // Handle file upload
  const handleUpload = async () => {
    if (!selectedFile) {
      setLocalError('Please select a file first.');
      return;
    }

    setLocalError('');
    clearError();

    try {
      let result;

      // Determine which upload function to use based on uploadEndpoint
      if (uploadEndpoint === 'chat') {
        result = await uploadChatFile(selectedFile);
      } else {
        result = await uploadFile(selectedFile);
      }

      setUploadedFile(result);

      // Reset selected file
      setSelectedFile(null);

      // Call the callback if provided
      if (onUploadComplete) {
        onUploadComplete(result);
      }
    } catch (err) {
      setLocalError(err.message || 'Upload failed. Please try again.');
    }
  };

  // Handle file deletion
  const handleDelete = async () => {
    if (!uploadedFile || !uploadedFile.filename) {
      return;
    }

    try {
      await deleteFile(uploadedFile.filename);

      // Reset states
      setUploadedFile(null);

      // Call the callback if provided
      if (onDeleteComplete) {
        onDeleteComplete();
      }
    } catch (err) {
      setLocalError(err.message || 'Failed to delete file.');
    }
  };

  return (
    <Card className="shadow-sm mb-4">
      <Card.Body>
        <Card.Title>Upload File</Card.Title>

        {/* Error messages */}
        {(error || localError) && (
          <Alert
            variant="danger"
            onClose={() => { clearError(); setLocalError(''); }}
            dismissible
          >
            {localError || error}
          </Alert>
        )}

        {/* File upload form */}
        <Form.Group className="mb-3">
          <Form.Label>Select {uploadEndpoint === 'chat' ? 'WhatsApp Chat' : ''} File</Form.Label>
          <div className="d-flex">
            <Form.Control
              type="text"
              value={selectedFile ? selectedFile.name : ''}
              placeholder="No file selected"
              readOnly
              className="me-2"
            />
            <Button
              variant="primary"
              onClick={handleSelectFileClick}
              disabled={isUploading || isDeleting}
            >
              Browse
            </Button>
          </div>
          <Form.Text className="text-muted">
            {uploadEndpoint === 'chat'
              ? 'Select a WhatsApp chat export file (.txt)'
              : `Accepted file type: ${fileType}`}
          </Form.Text>
          <Form.Control
            type="file"
            ref={fileInputRef}
            accept={fileType}
            onChange={handleFileChange}
            className="d-none"
          />
        </Form.Group>

        {/* Upload progress */}
        {isUploading && uploadProgress > 0 && (
          <ProgressBar
            now={uploadProgress}
            label={`${uploadProgress}%`}
            className="mb-3"
          />
        )}

        {/* Action buttons */}
        <div className="d-flex justify-content-between">
          {!uploadedFile ? (
            <Button
              variant="primary"
              onClick={handleUpload}
              disabled={!selectedFile || isUploading}
              className="d-flex align-items-center"
            >
              <Upload className="me-2" />
              {isUploading ? 'Uploading...' : 'Upload File'}
            </Button>
          ) : (
            <Alert variant="success" className="mb-0 flex-grow-1 d-flex align-items-center">
              <span className="me-auto">
                File uploaded: <strong>{uploadedFile.original_filename || uploadedFile.filename}</strong>
              </span>
              <Button
                variant="outline-danger"
                size="sm"
                onClick={handleDelete}
                disabled={isDeleting}
                className="ms-2 d-flex align-items-center"
              >
                <Trash className="me-1" />
                {isDeleting ? 'Deleting...' : 'Delete'}
              </Button>
            </Alert>
          )}
        </div>
      </Card.Body>
    </Card>
  );
};

export default FileUploader;