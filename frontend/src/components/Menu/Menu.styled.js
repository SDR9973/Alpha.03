import styled from "styled-components";

export const SidebarContainer = styled.div`
  height: 100vh;
  background-color: #fff;
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.05);
  transition: width 0.3s ease-in-out, background 0.3s ease-in-out;
  overflow: hidden;
  position: fixed;
  width: ${(props) => (props.isOpen ? "250px" : "80px")};
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding-top: 10px;
`;

export const LogoContainer = styled.div`
  padding: 20px;
  cursor: pointer;
  text-align: center;
  img {
    max-width: ${(props) => (props.isOpen ? "100%" : "40px")};
    transition: max-width 0.3s ease-in-out;
  }
`;

export const MenuList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
`;

export const MenuItem = styled.li`
  padding: 12px 20px;
  display: flex;
  align-items: center;
  cursor: pointer;
  border-radius: 8px;
  transition: background 0.3s ease-in-out, color 0.3s ease-in-out;
  color: #9399AF;
  font-weight: 500;

  &:hover {
    background-color: #e2e6ea;
    color: #343a40;
  }

  &.active {
    background-color: #eef2f7;
    color: #050D2D;
    font-weight: bold;
  }

  i {
    font-size: 20px;
    margin-right: ${(props) => (props.isOpen ? "15px" : "0")};
    transition: margin-right 0.3s ease-in-out;
  }

  span {
    font-size: 16px;
    display: ${(props) => (props.isOpen ? "inline" : "none")};
  }
`;
