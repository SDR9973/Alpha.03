import styled from "styled-components";

export const SidebarContainer = styled.div`
  height: 100vh;
  background-color: #f5f7fa;
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.1);
  transition: width 0.3s ease;
  overflow: hidden;
  position: fixed;
  width: ${(props) => (props.isOpen ? "250px" : "80px")};
`;

export const LogoContainer = styled.div`
  padding: 20px;
  cursor: pointer;
  text-align: center;
  img {
    max-width: ${(props) => (props.isOpen ? "100%" : "40px")};
    transition: max-width 0.3s ease;
  }
`;

export const MenuList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
`;

export const MenuItem = styled.li`
  padding: 15px;
  display: flex;
  align-items: center;
  cursor: pointer;
  transition: background 0.3s ease;

  &:hover {
    background-color: #e5e9f2;
  }

  i {
    font-size: 20px;
    margin-right: ${(props) => (props.isOpen ? "15px" : "0")};
    transition: margin-right 0.3s ease;
  }

  span {
    font-size: 16px;
    font-weight: bold;
    display: ${(props) => (props.isOpen ? "inline" : "none")};
  }
`;
