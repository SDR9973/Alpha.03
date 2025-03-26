// src/pages/EditProfile.jsx
import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Button, 
  Form, 
  Container, 
  Row, 
  Col, 
  Card, 
  Alert, 
  ProgressBar,
  Spinner,
  Image
} from "react-bootstrap";
import { useAuth } from "../providers/AuthProvider";
import { useFiles } from "../hooks/useFiles";

const EditProfile = () => {
  const navigate = useNavigate();
  const { user, updateProfile, isLoading, error } = useAuth();
  const { uploadFile: uploadAvatar, uploadProgress, status: fileStatus } = useFiles();
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  
  const [formError, setFormError] = useState("");
  const [success, setSuccess] = useState("");
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState("");
  const fileInputRef = useRef(null);
  
  // Initialize form with user data
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        email: user.email || "",
        password: "",
        confirmPassword: "",
      });
      
      if (user.avatar) {
        setAvatarPreview(user.avatar);
      }
    }
  }, [user]);
  
  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };
  
  // Handle avatar file selection
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Validate file type
    if (!file.type.startsWith("image/")) {
      setFormError("Please upload an image file.");
      return;
    }
    
    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setFormError("Image must be less than 2MB.");
      return;
    }
    
    setAvatarFile(file);
    
    // Create preview URL
    const previewUrl = URL.createObjectURL(file);
    setAvatarPreview(previewUrl);
    setFormError("");
  };
  
  // Handle avatar click to trigger file input
  const handleAvatarClick = () => {
    fileInputRef.current.click();
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    setSuccess("");
    
    const { name, email, password, confirmPassword } = formData;
    
    // Validate password match if provided
    if (password && password !== confirmPassword) {
      setFormError("Passwords do not match.");
      return;
    }
    
    // Prepare update data
    const updateData = {
      name,
      email,
    };
    
    // Only include password if provided
    if (password) {
      updateData.password = password;
    }
    
    try {
      // Upload avatar if selected
      if (avatarFile) {
        const formData = new FormData();
        formData.append("file", avatarFile);
        
        await uploadAvatar(formData);
      }
      
      // Update user profile
      await updateProfile(user.id, updateData);
      
      setSuccess("Profile updated successfully!");
      
      // Clear password fields
      setFormData(prev => ({
        ...prev,
        password: "",
        confirmPassword: ""
      }));
      
      // Redirect to profile page after a delay
      setTimeout(() => {
        navigate("/profile");
      }, 1500);
    } catch (err) {
      setFormError(err.message || "Failed to update profile. Please try again.");
    }
  };
  
  if (!user) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </Container>
    );
  }
  
  return (
    <Container className="py-5">
      <Row className="justify-content-center">
        <Col md={8}>
          <Card className="shadow">
            <Card.Header className="bg-primary text-white">
              <h4 className="mb-0">Edit Profile</h4>
            </Card.Header>
            
            <Card.Body className="p-4">
              {success && (
                <Alert variant="success" className="mb-4">
                  {success}
                </Alert>
              )}
              
              {(error || formError) && (
                <Alert variant="danger" className="mb-4">
                  {formError || error}
                </Alert>
              )}
              
              <Form onSubmit={handleSubmit}>
                <div className="text-center mb-4">
                  <div 
                    onClick={handleAvatarClick}
                    style={{ cursor: "pointer", display: "inline-block", position: "relative" }}
                  >
                    <Image
                      src={avatarPreview || "https://cdn-icons-png.flaticon.com/512/64/64572.png"}
                      roundedCircle
                      alt="Profile"
                      className="border"
                      style={{ width: "150px", height: "150px", objectFit: "cover" }}
                    />
                    <div 
                      className="position-absolute bottom-0 end-0 bg-primary text-white rounded-circle p-2"
                      style={{ width: "32px", height: "32px" }}
                    >
                      <i className="bi bi-camera-fill"></i>
                    </div>
                  </div>
                  
                  <Form.Control
                    type="file"
                    ref={fileInputRef}
                    hidden
                    accept="image/*"
                    onChange={handleFileChange}
                    disabled={isLoading}
                  />
                  
                  <Form.Text className="text-muted d-block mt-2">
                    Click the image to change your profile picture
                  </Form.Text>
                </div>
                
                {uploadProgress > 0 && uploadProgress < 100 && (
                  <ProgressBar 
                    now={uploadProgress} 
                    label={`${uploadProgress}%`}
                    className="mb-4"
                  />
                )}
                
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3" controlId="formBasicName">
                      <Form.Label>Full Name</Form.Label>
                      <Form.Control
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="Enter your full name"
                        required
                        disabled={isLoading}
                      />
                    </Form.Group>
                  </Col>
                  
                  <Col md={6}>
                    <Form.Group className="mb-3" controlId="formBasicEmail">
                      <Form.Label>Email address</Form.Label>
                      <Form.Control
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="Enter email"
                        required
                        disabled={isLoading}
                      />
                    </Form.Group>
                  </Col>
                </Row>
                
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3" controlId="formBasicPassword">
                      <Form.Label>New Password (optional)</Form.Label>
                      <Form.Control
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="Leave blank to keep current password"
                        disabled={isLoading}
                      />
                    </Form.Group>
                  </Col>
                  
                  <Col md={6}>
                    <Form.Group className="mb-3" controlId="formBasicConfirmPassword">
                      <Form.Label>Confirm New Password</Form.Label>
                      <Form.Control
                        type="password"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        placeholder="Confirm new password"
                        disabled={isLoading || !formData.password}
                      />
                    </Form.Group>
                  </Col>
                </Row>
                
                <div className="d-flex justify-content-between mt-4">
                  <Button 
                    variant="outline-secondary" 
                    onClick={() => navigate("/profile")}
                    disabled={isLoading}
                  >
                    Cancel
                  </Button>
                  
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
                      "Save Changes"
                    )}
                  </Button>
                </div>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default EditProfile;