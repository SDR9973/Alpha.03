import { useEffect, useState } from "react";
import { Route, Routes } from "react-router";
import { useNavigate } from "react-router";
import Header from "./Header"
import Profile from "./Profile";
import SignIn from "./SignIn";
import SignUp from "./SignUp";

export interface IUser {
    id: string;
    email: string;
    name: string;
    password: string;
}

function Layout() {
    const [user, setUser] = useState<IUser>({ id: "", email: "", name: "", password: "" });

    const navigate = useNavigate();
    useEffect(() => {

        user.name ? navigate("/profile") : navigate("/SignIn");
    }, [])
    return (
        <div>
            <Header  />
            <Routes>
                <Route path="/profile" element={<Profile user={user} setUser={setUser} />} />
                <Route path="/SignIn" element={<SignIn setUser={setUser} />} />
                <Route path="/SignUp" element={<SignUp setUser={setUser} />} />
            </Routes>
        </div>
    )
}

export default Layout