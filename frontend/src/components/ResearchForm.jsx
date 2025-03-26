// src/components/ResearchForm.jsx
import React, { useState, useEffect } from 'react';
import { Form, Button, Card, Row, Col, Alert, Spinner } from 'react-bootstrap';
import { useResearch } from '../providers/ResearchProvider';

const ResearchForm = ({ onSaveComplete }) => {
  const { saveResearchForm, error, clearError, isLoading } = useResearch();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    start_date: '',
    end_date: '',
    message_limit: 50,
  });

  const [validated, setValidated] = useState(false);
  const [formError, setFormError] = useState('');
  const [success, setSuccess] = useState(false);

  // Clear any existing errors when component mounts
  useEffect(() => {
    clearError();
  }, [clearError]);

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Form validation
    const form = e.currentTarget;
    if (form.checkValidity() === false) {
      e.stopPropagation();
      setValidated(true);
      return;
    }

    setFormError('');
    setSuccess(false);

    try {
      // Save research form
      const result = await saveResearchForm(formData);

      // Success
      setSuccess(true);
      setFormData({
        name: '',
        description: '',
        start_date: '',
        end_date: '',
        message_limit: 50,
      });
      setValidated(false);

      // Notify parent component
      if (onSaveComplete) {
        onSaveComplete(result);
      }
    } catch (err) {
      setFormError(err.message || 'Failed to save research form');
    }
  };

  return (
    <Card className="shadow mb-4">
      <Card.Header className="bg-primary text-white">
        <h5 className="mb-0">Create New Research</h5>
      </Card.Header>

      <Card.Body>
        {/* Success message */}
        {success && (
          <Alert variant="success" onClose={() => setSuccess(false)} dismissible>
            Research created successfully!
          </Alert>
        )}

        {/* Error messages */}
        {(error || formError) && (
          <Alert variant="danger" onClose={() => { clearError(); setFormError(''); }} dismissible>
            {formError || error}
          </Alert>
        )}

        <Form noValidate validated={validated} onSubmit={handleSubmit}>
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Research Name</Form.Label>
                <Form.Control
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter research name"
                  required
                  disabled={isLoading}
                />
                <Form.Control.Feedback type="invalid">
                  Please provide a research name.
                </Form.Control.Feedback>
              </Form.Group>
            </Col>

            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Message Limit</Form.Label>
                <Form.Control
                  type="number"
                  name="message_limit"
                  value={formData.message_limit}
                  onChange={handleChange}
                  min={1}
                  max={1000}
                  disabled={isLoading}
                />
              </Form.Group>
            </Col>
          </Row>

          <Form.Group className="mb-3">
            <Form.Label>Description</Form.Label>
            <Form.Control
              as="textarea"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Enter research description"
              rows={3}
              disabled={isLoading}
            />
          </Form.Group>

          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Start Date</Form.Label>
                <Form.Control
                  type="date"
                  name="start_date"
                  value={formData.start_date}
                  onChange={handleChange}
                  disabled={isLoading}
                />
              </Form.Group>
            </Col>

            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>End Date</Form.Label>
                <Form.Control
                  type="date"
                  name="end_date"
                  value={formData.end_date}
                  onChange={handleChange}
                  disabled={isLoading}
                />
              </Form.Group>
            </Col>
          </Row>

          <div className="d-flex justify-content-end mt-3">
            <Button
              variant="primary"
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Spinner
                    as="span"
                    animation="border"
                    size="sm"
                    role="status"
                    aria-hidden="true"
                    className="me-2"
                  />
                  Saving...
                </>
              ) : (
                'Save Research'
              )}
            </Button>
          </div>
        </Form>
      </Card.Body>
    </Card>
  );
};

export default ResearchForm;