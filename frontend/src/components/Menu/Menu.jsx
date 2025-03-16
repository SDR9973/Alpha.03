import React, { useState } from "react";
import { SidebarContainer, LogoContainer, MenuList, MenuItem } from "./Menu.styled";
import { House, FileText, Clock, BoxArrowRight, Person } from "react-bootstrap-icons";
import LogoFull from "../../assets/Logo.png";
import LogoMini from "../../assets/LogoMini.png";
import { Container, Row, Col } from "react-bootstrap";

const Menu = ({ isOpen, setIsOpen }) => {
  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  return (
    <SidebarContainer isOpen={isOpen} className="d-flex flex-column justify-content-between">
      <div>
        <LogoContainer onClick={toggleSidebar} isOpen={isOpen} className="text-center py-4 mb-4">
          <img src={isOpen ? LogoFull : LogoMini} alt="Logo" className="img-fluid" />
        </LogoContainer>
        <MenuList className={isOpen ? "m-3" : "pt-5"}>
          <MenuItem isOpen={isOpen} active className="d-flex align-items-center py-3 px-4">
            <House size={22} /><span className={isOpen ? "ms-4 d-inline" : "d-none"}>Dashboard</span>
          </MenuItem>
          <MenuItem isOpen={isOpen} className="d-flex align-items-center py-3 px-4">
            <FileText size={22} /><span className={isOpen ? "ms-4 d-inline" : "d-none"}>Reports</span>
          </MenuItem>
          <MenuItem isOpen={isOpen} className="d-flex align-items-center py-3 px-4">
            <Clock size={22} /><span className={isOpen ? "ms-4 d-inline" : "d-none"}>History</span>
          </MenuItem>
          <MenuItem isOpen={isOpen} className="d-flex align-items-center py-3 px-4">
            <Person size={22} /><span className={isOpen ? "ms-4 d-inline" : "d-none"}>Profile</span>
          </MenuItem>
        </MenuList>
      </div>
      <div className="border-top py-3">
        <MenuItem isOpen={isOpen} className="d-flex align-items-center py-3 px-4">
          <BoxArrowRight size={22} /><span className={isOpen ? "ms-4 d-inline" : "d-none"}>Logout</span>
        </MenuItem>
      </div>
    </SidebarContainer>
  );
};

export default Menu;