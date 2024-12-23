import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import Container from "react-bootstrap/Container";
import { useSelector, useDispatch } from "react-redux";
import { updateUser } from "../redux/user/userSlice";

const EditProfile = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { currentUser, token } = useSelector((state) => state.user);

  useEffect(() => {
    if (!token) {
      navigate("/sign-in");
    }
  }, [token, navigate]);

  const [formData, setFormData] = useState({
    name: currentUser?.name || "",
    email: currentUser?.email || "",
  });

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`http://localhost:8001/users/${currentUser.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error("Failed to update profile");
      }

      const updatedUser = await response.json();
      dispatch(updateUser(updatedUser));
      navigate("/profile");
    } catch (error) {
      alert(error.message);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  return (
    <Container className="mt-5">
      <h2 className="text-center">Edit Profile</h2>
      <Form onSubmit={handleSave} className="mt-4" style={{ maxWidth: "500px", margin: "0 auto" }}>
        <Form.Group className="mb-3" controlId="formBasicName">
          <Form.Label>Name</Form.Label>
          <Form.Control
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Enter your name"
            required
          />
        </Form.Group>

        <Form.Group className="mb-3" controlId="formBasicEmail">
          <Form.Label>Email</Form.Label>
          <Form.Control
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Enter your email"
            required
          />
        </Form.Group>

        <div className="text-center">
          <Button variant="primary" type="submit">
            Save
          </Button>
        </div>
      </Form>
    </Container>
  );
};

export default EditProfile;