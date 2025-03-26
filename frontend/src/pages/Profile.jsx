// src/pages/Profile.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Container, Row, Col, Card, Alert, Modal, Spinner } from "react-bootstrap";
import { useAuth } from "../providers/AuthProvider";

const Profile = () => {
  const navigate = useNavigate();
  const { user, logout, deleteAccount, isLoading } = useAuth();
  
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  
  // If no user, redirect to login (this should not happen due to ProtectedRoute)
  if (!user) {
    navigate("/sign-in");
    return null;
  }
  
  const handleEditProfile = () => {
    navigate("/edit-profile");
  };
  
  const handleLogout = () => {
    logout();
  };
  
  const handleDeleteAccountClick = () => {
    setShowDeleteModal(true);
  };
  
  const handleDeleteAccountConfirm = async () => {
    setIsDeleting(true);
    setDeleteError("");
    
    try {
      await deleteAccount(user.id);
      // No need to navigate as the hook will handle that
    } catch (error) {
      setDeleteError(error.message || "Failed to delete account. Please try again.");
      setIsDeleting(false);
    }
  };
  
  const handleCloseDeleteModal = () => {
    setShowDeleteModal(false);
    setDeleteError("");
  };
  
  const avatarUrl = user.avatar || "https://cdn-icons-png.flaticon.com/512/64/64572.png";
  
  return (
    <Container className="py-5">
      <Row className="justify-content-center">
        <Col md={8} lg={6}>
          <Card className="shadow">
            <Card.Header className="bg-primary text-white">
              <h4 className="mb-0">User Profile</h4>
            </Card.Header>
            
            <Card.Body className="text-center py-4">
              <div className="mb-4">
                <img
                  src={avatarUrl}
                  alt="Profile"
                  className="rounded-circle img-thumbnail"
                  style={{ width: "150px", height: "150px", objectFit: "cover" }}
                />
              </div>
              
              <h3>{user.name}</h3>
              <p className="text-muted mb-4">{user.email}</p>
              
              <div className="d-grid gap-2 d-md-block">
                <Button 
                  variant="primary" 
                  className="me-md-2 mb-2 mb-md-0"
                  onClick={handleEditProfile}
                  disabled={isLoading}
                >
                  Edit Profile
                </Button>
                <Button 
                  variant="outline-primary" 
                  className="me-md-2 mb-2 mb-md-0"
                  onClick={handleLogout}
                  disabled={isLoading}
                >
                  Logout
                </Button>
                <Button 
                  variant="outline-danger"
                  onClick={handleDeleteAccountClick}
                  disabled={isLoading}
                >
                  Delete Account
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      {/* Delete Account Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={handleCloseDeleteModal} centered>
        <Modal.Header closeButton>
          <Modal.Title>Delete Account</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {deleteError && (
            <Alert variant="danger" className="mb-3">
              {deleteError}
            </Alert>
          )}
          <p>Are you sure you want to delete your account? This action cannot be undone.</p>
          <p>All your data will be permanently removed.</p>
        </Modal.Body>
        <Modal.Footer>
          <Button 
            variant="secondary" 
            onClick={handleCloseDeleteModal}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button 
            variant="danger" 
            onClick={handleDeleteAccountConfirm}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <>
                <Spinner
                  as="span"
                  animation="border"
                  size="sm"
                  role="status"
                  aria-hidden="true"
                  className="me-2"
                />
                Deleting...
              </>
            ) : (
              "Delete Account"
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default Profile;