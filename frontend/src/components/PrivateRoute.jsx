import React from "react";
import { useSelector } from "react-redux";
import { Navigate, Outlet } from "react-router-dom";

const PrivateRoute = () => {
  const { token } = useSelector((state) => state.user);

  return token ? <Outlet /> : <Navigate to="/sign-in" />;
};

export default PrivateRoute;
