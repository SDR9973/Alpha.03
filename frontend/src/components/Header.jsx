import Container from 'react-bootstrap/Container';
import Navbar from 'react-bootstrap/Navbar';
import Image from 'react-bootstrap/Image';

const Header = () => {
  return (
    <Navbar expand="lg" className="bg-body-tertiary">
      <Container>
        <Navbar.Collapse className="justify-content-end">
          <Image
            src="https://www.iconpacks.net/icons/2/free-user-icon-3296-thumb.png" 
            roundedCircle
            alt="Profile"
            style={{ width: '40px', height: '40px' }}
          />
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default Header;
