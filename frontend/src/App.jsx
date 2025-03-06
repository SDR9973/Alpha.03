import { useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./App.css";
import Home from "./pages/Home.jsx";
import SignIn from "./pages/SignIn.jsx";
import SignUp from "./pages/SignUp.jsx";
import Profile from "./pages/Profile.jsx";
import EditProfile from "./pages/EditProfile.jsx";
import PrivateRoute from "./components/PrivateRoute";
import Header from "./components/Header/Header.jsx";
import Menu from "./components/Menu/Menu.jsx";
import UploadWhatsAppFile from "./pages/Form.jsx";

function App() {
  const [isOpen, setIsOpen] = useState(false);
  const user = localStorage.getItem("user");

  return (
    <BrowserRouter>
      <Menu isOpen={isOpen} setIsOpen={setIsOpen} />
      <Header isOpen={isOpen} />
      {/* {user && <Header isOpen={isOpen} />} */}
      <div className={`main-content ${isOpen ? "expanded" : "collapsed"}`}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/sign-in" element={<SignIn />} />
          <Route path="/sign-up" element={<SignUp />} />
          <Route element={<PrivateRoute />}>
            <Route path="/profile" element={<Profile />} />
            <Route path="/edit-profile" element={<EditProfile />} />
          </Route>
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
