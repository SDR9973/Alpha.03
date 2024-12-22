import React, { useState } from "react";
import {
  SidebarContainer,
  LogoContainer,
  MenuList,
  MenuItem,
} from "./Menu.styled";

import LogoFull from "../../assets/Logo.png";
import LogoMini from "../../assets/LogoMini.png";


const Menu = () => {
  const [isOpen, setIsOpen] = useState(true); // State to manage menu open/close

  const toggleSidebar = () => {
    setIsOpen(!isOpen); // Toggle the sidebar state
  };

  const handleItemClick = () => {
    setIsOpen(false); // Close the menu when a menu item is clicked
  };

  return (
    <SidebarContainer isOpen={isOpen}>

      <LogoContainer onClick={toggleSidebar} isOpen={isOpen}>
        {isOpen ? (
          <img src={LogoFull} alt="Full Logo" />
        ) : (
          <img src={LogoMini} alt="Small Logo" />
        )}
      </LogoContainer>

      <MenuList>
        <MenuItem onClick={handleItemClick} isOpen={isOpen}>
          <i className="icon-dashboard"></i>
          <span>Dashboard</span>
        </MenuItem>
        <MenuItem onClick={handleItemClick} isOpen={isOpen}>
          <i className="icon-reports"></i>
          <span>Reports</span>
        </MenuItem>
        <MenuItem onClick={handleItemClick} isOpen={isOpen}>
          <i className="icon-history"></i>
          <span>History</span>
        </MenuItem>
        <MenuItem onClick={handleItemClick} isOpen={isOpen}>
          <i className="icon-profile"></i>
          <span>Profile</span>
        </MenuItem>
        <MenuItem onClick={handleItemClick} isOpen={isOpen}>
          <i className="icon-logout"></i>
          <span>Logout</span>
        </MenuItem>
      </MenuList>
    </SidebarContainer>
  );
};

export default Menu;
