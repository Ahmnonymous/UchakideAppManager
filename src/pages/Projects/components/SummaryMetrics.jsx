import React from "react";
import { Row, Col, Card, CardBody } from "reactstrap";

const SummaryMetrics = ({ metrics = {} }) => {
  const cards = [
    {
      title: "Payments",
      value: metrics.payment_count || 0,
      subtext: `$ ${Number(metrics.total_payments || 0).toFixed(2)}`,
      icon: "bx bx-credit-card",
      color: "primary",
    },
    {
      title: "Open Bugs",
      value: metrics.open_bugs || 0,
      subtext: "Issues pending",
      icon: "bx bx-bug",
      color: "danger",
    },
    {
      title: "Reports",
      value: metrics.report_count || 0,
      subtext: "Configured",
      icon: "bx bx-bar-chart",
      color: "info",
    },
    {
      title: "Attachments",
      value: metrics.attachment_count || 0,
      subtext: "Files stored",
      icon: "bx bx-paperclip",
      color: "warning",
    },
  ];

  return (
    <Row className="mb-3">
      {cards.map((item) => (
        <Col xl={3} md={6} sm={6} xs={12} key={item.title} className="mb-3">
          <Card className="mini-stats-wid h-100">
            <CardBody>
              <div className="d-flex">
                <div className="flex-grow-1">
                  <p className="text-muted fw-medium mb-1">{item.title}</p>
                  <h4 className="mb-0">{item.value}</h4>
                  <small className="text-muted">{item.subtext}</small>
                </div>
                <div className="avatar-sm rounded-circle bg-light align-self-center mini-stat-icon">
                  <span className={`avatar-title rounded-circle bg-${item.color}`}>
                    <i className={`${item.icon} font-size-20`} />
                  </span>
                </div>
              </div>
            </CardBody>
          </Card>
        </Col>
      ))}
    </Row>
  );
};

export default SummaryMetrics;


