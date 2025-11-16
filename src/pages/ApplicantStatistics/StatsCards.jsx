import React from "react";
import { Row, Col, Card, CardBody, Spinner } from "reactstrap";

const StatsCards = ({ data, loading }) => {
  const stats = [
    {
      title: "Total Applicants",
      value: data.totalApplicants || 0,
      iconClass: "bx-user",
      color: "primary",
      subtitle: "All registered applicants",
    },
    {
      title: "Active Files",
      value: data.activeApplicants || 0,
      iconClass: "bx-file-find",
      color: "success",
      subtitle: "Currently active cases",
    },
    {
      title: "New This Month",
      value: data.newThisMonth || 0,
      iconClass: "bx-trending-up",
      color: "warning",
      subtitle: "Recent registrations",
    },
  ];

  return (
    <Row>
      {stats.map((stat, index) => (
        <Col md="4" key={index}>
          <Card className="mini-stats-wid card-animate">
            <CardBody>
              {loading ? (
                <div className="d-flex align-items-center justify-content-center" style={{ minHeight: "80px" }}>
                  <Spinner color={stat.color} size="sm" />
                </div>
              ) : (
                <div className="d-flex">
                  <div className="flex-grow-1">
                    <p className="text-muted fw-medium mb-2">{stat.title}</p>
                    <h4 className="mb-0 fw-bold">
                      {stat.value.toLocaleString()}
                    </h4>
                    <p className="text-muted mb-0 font-size-11 mt-1">
                      {stat.subtitle}
                    </p>
                  </div>
                  <div className="flex-shrink-0 align-self-center">
                    <div className="avatar-sm rounded-circle mini-stat-icon">
                      <span className={`avatar-title rounded-circle bg-${stat.color}`}>
                        <i className={`bx ${stat.iconClass} font-size-24`}></i>
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </CardBody>
          </Card>
        </Col>
      ))}
    </Row>
  );
};

export default StatsCards;

