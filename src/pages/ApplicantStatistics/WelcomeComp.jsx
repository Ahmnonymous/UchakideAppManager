import React from "react";
import { Row, Col, Card } from "reactstrap";
import { useRole } from "../../helpers/useRole";

import avatar1 from "../../assets/images/users/avatar-1.jpg";
import profileImg from "../../assets/images/profile-img.png";

const WelcomeComp = () => {
  const { user, username } = useRole();

  const getUserName = () => {
    const displayName = [user?.name, user?.surname].filter(Boolean).join(" ").trim();
    if (displayName) return displayName;
    if (username) return username;
    if (user?.username) return user.username;
    return "User";
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };

  // Get current date
  const getCurrentDate = () => {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return new Date().toLocaleDateString('en-US', options);
  };

  return (
    <React.Fragment>
      <Card className="overflow-hidden shadow-sm border-0" style={{ borderRadius: '12px' }}>
        <div className="bg-primary bg-gradient" style={{ background: 'linear-gradient(135deg, #556ee6 0%, #6f42c1 100%)' }}>
          <Row>
            <Col lg="9" md="7" xs="7">
              <div className="text-white p-4">
                <h6 className="text-white-50 mb-2 font-size-13 text-uppercase" style={{ letterSpacing: '0.5px' }}>
                  {getGreeting()}
                </h6>
                <h4 className="text-white fw-bold mb-2">
                  Welcome back, {getUserName()}!
                </h4>
                <p className="text-white-50 mb-0 font-size-14">
                  <i className="bx bx-calendar me-1"></i>
                  {getCurrentDate()}
                </p>
              </div>
            </Col>
            <Col lg="3" md="5" xs="5" className="align-self-end">
              <img src={profileImg} alt="" className="img-fluid" style={{ maxHeight: '140px' }} />
            </Col>
          </Row>
        </div>
        </Card>
    </React.Fragment>
  );
};

export default WelcomeComp;

