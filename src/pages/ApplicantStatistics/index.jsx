import PropTypes from "prop-types";
import React from "react";
import { Container, Row, Col } from "reactstrap";
import { withTranslation } from "react-i18next";

import WelcomeComp from "./WelcomeComp";
import Breadcrumbs from "../../components/Common/Breadcrumb";

const ApplicantStatistics = (props) => {
  document.title = "Dashboard | Uchakide App Manager";

  return (
    <React.Fragment>
      <div className="page-content">
        <Container fluid>
          <Breadcrumbs
            title={props.t("Dashboard")}
            breadcrumbItem={props.t("Dashboard")}
          />
          <Row>
            <Col>
              <WelcomeComp />
            </Col>
          </Row>
        </Container>
      </div>
    </React.Fragment>
  );
};

ApplicantStatistics.propTypes = {
  t: PropTypes.any,
};

export default withTranslation()(ApplicantStatistics);

