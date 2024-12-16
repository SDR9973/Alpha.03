import { Dispatch, SetStateAction, useState } from "react"
import { IUser } from "./Layout"
import { NavLink, useNavigate } from "react-router";
import axios from "axios";

interface ISignUp {
    setUser: Dispatch<SetStateAction<IUser>>;
}
function SignUp({ setUser }: ISignUp) {
    const [credentials, setCredentials] = useState({
        name: '',
        password: '',
        email: ''
    });
    const navigate = useNavigate();

    const handleSignUp = async (e: React.FormEvent) => {
        e.preventDefault();
        console.log(typeof credentials.password)
        const user = JSON.stringify({ password: credentials.password, email: credentials.email, name: credentials.name });
        try {
            const data = await axios.post("http://localhost:8000/researchers", user, {
                headers: {
                    "Accept": "*/*",
                    "Content-Type":"application/json"
                }
            });
            console.log(data.data)
            setUser(data.data);
            navigate('/profile');
            alert('Sign In Successful!');
        } catch (error) {
            console.log(error)

        }


    };

    return (
        <div className="container mt-5">
            <div className="row justify-content-center">
                <div className="col-md-6">
                    <div className="card">
                        <div className="card-header">Sign Up</div>
                        <div className="card-body">
                            <form onSubmit={handleSignUp}>
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
                                <button type="submit" className="btn btn-primary">Sign Up</button>
                            </form>
                            <NavLink to={"/SignIn"}>have account? SignIn here</NavLink>

                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default SignUp