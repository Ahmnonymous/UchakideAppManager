import React from "react";
import { Alert } from "reactstrap";

const getAlertIcon = (color) => {
  switch (color) {
    case "success":
      return "mdi mdi-check-all";
    case "danger":
      return "mdi mdi-block-helper";
    case "warning":
      return "mdi mdi-alert-outline";
    case "info":
      return "mdi mdi-alert-circle-outline";
    default:
      return "mdi mdi-information";
  }
};

const getAlertBackground = (color) => {
  switch (color) {
    case "success":
      return "#d4edda";
    case "danger":
      return "#f8d7da";
    case "warning":
      return "#fff3cd";
    case "info":
      return "#d1ecf1";
    default:
      return "#f8f9fa";
  }
};

const getAlertBorder = (color) => {
  switch (color) {
    case "success":
      return "#c3e6cb";
    case "danger":
      return "#f5c6cb";
    case "warning":
      return "#ffeaa7";
    case "info":
      return "#bee5eb";
    default:
      return "#dee2e6";
  }
};

const TopRightAlert = ({ alert, onClose }) => {
  if (!alert) return null;
  return (
    <div
      className="position-fixed top-0 end-0 p-3"
      style={{ zIndex: 1060, minWidth: "300px", maxWidth: "500px" }}
    >
      <Alert
        color={alert.color}
        isOpen={!!alert}
        toggle={onClose}
        className="alert-dismissible fade show shadow-lg"
        role="alert"
        style={{
          opacity: 1,
          backgroundColor: getAlertBackground(alert.color),
          border: `1px solid ${getAlertBorder(alert.color)}`,
          color: "#000",
        }}
      >
        <i className={`${getAlertIcon(alert.color)} me-2`}></i>
        {alert.message}
      </Alert>
    </div>
  );
};

export default TopRightAlert;


