import { Dispatch, MouseEventHandler, SetStateAction, useState } from "react";
import axios from "axios";
import {  useNavigate } from "react-router";
import { IUser } from "./Layout";

interface IProfile {
  setUser: Dispatch<SetStateAction<IUser>>;
  user: IUser;
}
function Profile({ user, setUser }: IProfile) {
  const [isEditing, setIsEditing] = useState(false);
  const [credentials, setCredentials] = useState({
    name: '',
    password: '',
    email: ''
  });
  const navigate = useNavigate();

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = JSON.stringify(credentials);
    try {
      const res = await axios.put("http://localhost:8000/researchers/" + user.id, payload, {
        headers: {
          "Accept": "*/*",
          "Content-Type": "application/json"
        }
      });
      console.log(res.data)
      setUser({ ...user, ...credentials });
      setCredentials({ name: '', password: '', email: '' });
      setIsEditing(false);
      alert('Profile Updated Successfully!');
    } catch (error) {
      console.log(error);
    }

  };

  const handleDelete: MouseEventHandler = async (e) => {
    e.preventDefault();
    try {
      await axios.delete("http://localhost:8000/researchers/" + user.id, {
        headers: {
            "Accept": "*/*",
            "Content-Type":"application/json"
        }
    });
    alert("Profile deleted");
    navigate("/SignUp")
    } catch (error) {
      console.log(error)
    }
  }


  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-8">
          <div className="card">
            <div className="card-header d-flex justify-content-between align-items-center">
              User Profile
              <button
                className="btn btn-primary btn-sm"
                onClick={() => setIsEditing(!isEditing)}
              >
                {isEditing ? 'Cancel' : 'Edit Profile'}
              </button>
            </div>
            <div className="card-body">
              {!isEditing ? (
                <div>
                  <p className="card-text"><strong>Name:</strong> {user.name}</p>
                  <p className="card-text"><strong>Email:</strong> {user.email}</p>
                  <button className="btn btn-danger" onClick={handleDelete}>Delete Profile</button>

                </div>
              ) : (
                <form onSubmit={handleUpdate}>
                  <div className="mb-3">
                    <label htmlFor="name" className="form-label">Name</label>
                    <input
                      type="text"
                      className="form-control"
                      id="name"
                      value={credentials.name}
                      onChange={(e) => setCredentials({ ...credentials, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label htmlFor="email" className="form-label">Email</label>
                    <input
                      type="email"
                      className="form-control"
                      id="email"
                      value={credentials.email}
                      onChange={(e) => setCredentials({ ...credentials, email: e.target.value })}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label htmlFor="password" className="form-label">Password</label>
                    <input
                      type="password"
                      className="form-control"
                      id="password"
                      value={credentials.password}
                      onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                      required
                    />
                  </div>
                  <button type="submit" className="btn btn-success">Update Profile</button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Profile