// src/pages/SignUp.jsx
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button, Form, Container, Alert, Spinner } from "react-bootstrap";
import { useAuth } from "../providers/AuthProvider";
import OAuth from '../components/OAuth.jsx';

const SignUp = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  
  const [formError, setFormError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();
  
  // Get auth state and functions from context
  const { register, isAuthenticated, isLoading, error } = useAuth();
  
  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate("/profile");
    }
  }, [isAuthenticated, navigate]);
  
  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    setSuccess("");
    
    const { name, email, password, confirmPassword } = formData;
    
    // Validate form inputs
    if (!name || !email || !password || !confirmPassword) {
      setFormError("Please fill in all fields");
      return;
    }
    
    if (password !== confirmPassword) {
      setFormError("Passwords do not match");
      return;
    }
    
    if (password.length < 6) {
      setFormError("Password must be at least 6 characters");
      return;
    }
    
    try {
      // Register the user
      const result = await register({ name, email, password });
      
      // Set success message
      setSuccess("Registration successful! You can now sign in.");
      
      // Clear the form
      setFormData({ name: "", email: "", password: "", confirmPassword: "" });
      
      // Redirect to sign in page after a delay
      setTimeout(() => {
        navigate("/sign-in");
      }, 2000);
    } catch (err) {
      setFormError(err.message || "Registration failed. Please try again.");
    }
  };
  
  return (
    <Container
      className="d-flex justify-content-center align-items-center"
      style={{ minHeight: "100vh" }}
    >
      <Form 
        style={{ width: "100%", maxWidth: "400px" }} 
        onSubmit={handleSubmit}
      >
        <h3 className="text-center mb-4">Sign Up</h3>
        
        {/* Show success message */}
        {success && (
          <Alert variant="success" className="text-center">
            {success}
          </Alert>
        )}
        
        {/* Show error messages */}
        {(error || formError) && (
          <Alert variant="danger" className="text-center">
            {formError || error}
          </Alert>
        )}
        
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
        
        <Form.Group className="mb-3" controlId="formBasicPassword">
          <Form.Label>Password</Form.Label>
          <Form.Control
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Password"
            required
            disabled={isLoading}
          />
          <Form.Text className="text-muted">
            Password must be at least 6 characters long.
          </Form.Text>
        </Form.Group>
        
        <Form.Group className="mb-3" controlId="formBasicConfirmPassword">
          <Form.Label>Confirm Password</Form.Label>
          <Form.Control
            type="password"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            placeholder="Confirm Password"
            required
            disabled={isLoading}
          />
        </Form.Group>
        
        <Button 
          variant="primary" 
          type="submit" 
          className="w-100 mb-3"
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
              Signing Up...
            </>
          ) : (
            "Sign Up"
          )}
        </Button>
        
        <OAuth />
        
        <p className="text-center">
          Already have an account?{" "}
          <Link to="/sign-in" style={{ textDecoration: "none" }}>
            Sign In
          </Link>
        </p>
      </Form>
    </Container>
  );
};

export default SignUp;