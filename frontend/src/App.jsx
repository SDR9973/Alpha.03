// src/App.jsx
import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Provider } from "react-redux";
import store from "./redux/store";
import "./App.css";

// Auth Provider
import { AuthProvider } from "./providers/AuthProvider";

// Components
import Header from "./components/Header/Header.jsx";
import Menu from "./components/Menu/Menu.jsx";
import ProtectedRoute from "./components/ProtectedRoute";

// Pages
import Home from "./pages/Home.jsx";
import SignIn from "./pages/SignIn.jsx";
import SignUp from "./pages/SignUp.jsx";
import Profile from "./pages/Profile.jsx";
import EditProfile from "./pages/EditProfile.jsx";
import HomeW from "./pages/HomeW.jsx";
import ChoosePlatform from "./pages/ChoosePlatform.jsx";

function AppContent() {
  const [isOpen, setIsOpen] = useState(false);
  const [userChecked, setUserChecked] = useState(false);

  // Check if user is logged in on component mount
  useEffect(() => {
    const checkUser = () => {
      const user = localStorage.getItem("user");
      setUserChecked(true);
    };
    
    checkUser();
  }, []);

  // Don't render anything until we've checked for the user
  if (!userChecked) {
    return <div>Loading...</div>;
  }

  return (
    <>
      <Menu isOpen={isOpen} setIsOpen={setIsOpen} />
      <Header isOpen={isOpen} />
      <div className={`main-content ${isOpen ? "expanded" : "collapsed"}`}>
        <Routes>
          <Route path="/" element={<ChoosePlatform />} />
          <Route path="/home" element={<Home />} />
          <Route path="/home_wikipedia" element={<HomeW />} />
          <Route path="/sign-in" element={<SignIn />} />
          <Route path="/sign-up" element={<SignUp />} />
          
          {/* Protected Routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/profile" element={<Profile />} />
            <Route path="/edit-profile" element={<EditProfile />} />
          </Route>
        </Routes>
      </div>
    </>
  );
}

function App() {
  return (
    <Provider store={store}>
      <BrowserRouter>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </BrowserRouter>
    </Provider>
  );
}

export default App;