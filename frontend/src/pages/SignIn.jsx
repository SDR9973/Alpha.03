// src/pages/SignIn.jsx
import React, { useState, useEffect } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { Button, Form, Container, Alert, Spinner } from "react-bootstrap";
import { useAuth } from "../providers/AuthProvider";
import OAuth from "../components/OAuth.jsx";

const SignIn = () => {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [formError, setFormError] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get auth state and functions from context
  const { login, isAuthenticated, isLoading, error } = useAuth();
  
  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      // Redirect to the page they tried to visit or dashboard
      const from = location.state?.from || "/profile";
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, location]);
  
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
    
    const { email, password } = formData;
    
    if (!email || !password) {
      setFormError("Please fill in all fields");
      return;
    }
    
    try {
      await login({ email, password });
      // No need to navigate here as the useEffect will handle that
    } catch (err) {
      setFormError(err.message || "Login failed. Please check your credentials.");
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
        <h3 className="text-center mb-4">Sign In</h3>
        
        {/* Show API errors */}
        {(error || formError) && (
          <Alert variant="danger" className="text-center">
            {formError || error}
          </Alert>
        )}
        
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
              Signing In...
            </>
          ) : (
            "Sign In"
          )}
        </Button>
        
        <OAuth />
        
        <p className="text-center">
          Don't have an account?{" "}
          <Link to="/sign-up" style={{ textDecoration: "none" }}>
            Sign Up
          </Link>
        </p>
      </Form>
    </Container>
  );
};

export default SignIn;