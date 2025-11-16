import PropTypes from "prop-types";
import React, { useState, useEffect } from "react";
import { Collapse } from "reactstrap";
import { Link } from "react-router-dom";
import withRouter from "../Common/withRouter";
import classname from "classnames";

//i18n
import { withTranslation } from "react-i18next";

import { connect } from "react-redux";

// ✅ Import role-based access control helper
import { useRole } from "../../helpers/useRole";

const Navbar = (props) => {
  const [management, setManagement] = useState(false);
  const [reports, setReports] = useState(false);
  
  // ✅ Get user role information
  const {
    canAccessNav,
    canEditModule,
    isOrgExecutive,
  } = useRole();

  useEffect(() => {
    var matchingMenuItem = null;
    var ul = document.getElementById("navigation");
    var items = ul.getElementsByTagName("a");
    removeActivation(items);
    for (var i = 0; i < items.length; ++i) {
      if (window.location.pathname === items[i].pathname) {
        matchingMenuItem = items[i];
        break;
      }
    }
    if (matchingMenuItem) {
      activateParentDropdown(matchingMenuItem);
    }
  });

  const removeActivation = (items) => {
    for (var i = 0; i < items.length; ++i) {
      var item = items[i];
      const parent = items[i].parentElement;
      if (item && item.classList.contains("active")) {
        item.classList.remove("active");
      }
      if (parent) {
        if (parent.classList.contains("active")) {
          parent.classList.remove("active");
        }
      }
    }
  };

  function activateParentDropdown(item) {
    item.classList.add("active");
    const parent = item.parentElement;
    if (parent) {
      parent.classList.add("active"); // li
      const parent2 = parent.parentElement;
      parent2.classList.add("active"); // li
      const parent3 = parent2.parentElement;
      if (parent3) {
        parent3.classList.add("active"); // li
        const parent4 = parent3.parentElement;
        if (parent4) {
          parent4.classList.add("active"); // li
          const parent5 = parent4.parentElement;
          if (parent5) {
            parent5.classList.add("active"); // li
            const parent6 = parent5.parentElement;
            if (parent6) {
              parent6.classList.add("active"); // li
            }
          }
        }
      }
    }
    return false;
  }

  return (
    <React.Fragment>
      <div className="topnav">
        <div className="container-fluid">
          <nav
            className="navbar navbar-light navbar-expand-lg topnav-menu"
            id="navigation"
          >
            <Collapse
              isOpen={props.leftMenu}
              className="navbar-collapse"
              id="topnav-menu-content"
            >
              <ul className="navbar-nav">
                <li className="nav-item">
                  <Link to="/projects" className="nav-link">
                    <i className="bx bx-bar-chart-alt-2 me-2"></i>
                    {props.t("App Manager")}
                  </Link>
                </li>

                {/* Management dropdown – render only when at least one item is accessible */}
                {(() => {
                  const managementLinks = [
                    canAccessNav("centers") && (
                      <Link to="/centers" className="dropdown-item" key="centers">
                        <i className="bx bx-building me-2"></i>
                        {props.t("Center Management")}
                      </Link>
                    ),
                    canAccessNav("meetings") && (
                      <Link to="/meetings" className="dropdown-item" key="meetings">
                        <i className="bx bx-calendar me-2"></i>
                        {props.t("Meetings Management")}
                      </Link>
                    ),
                    canAccessNav("suppliers") && (
                      <Link to="/suppliers" className="dropdown-item" key="suppliers">
                        <i className="bx bx-store me-2"></i>
                        {props.t("Supplier Management")}
                      </Link>
                    ),
                    canAccessNav("inventory") && (
                      <Link to="/inventory" className="dropdown-item" key="inventory">
                        <i className="bx bx-box me-2"></i>
                        {props.t("Inventory Management")}
                      </Link>
                    ),
                  ].filter(Boolean);

                  if (!managementLinks.length) {
                    return null;
                  }

                  return (
                  <li className="nav-item dropdown">
                    <Link
                      className="nav-link dropdown-toggle arrow-none"
                      to="/#"
                      onClick={(e) => {
                        e.preventDefault();
                        setManagement(!management);
                      }}
                    >
                      <i className="bx bx-buildings me-2"></i>
                      {props.t("Management")} <div className="arrow-down"></div>
                    </Link>
                    <div className={classname("dropdown-menu", { show: management })}>
                      {managementLinks}
                    </div>
                  </li>
                  );
                })()}

                {/* Create Applicant – only roles with write access */}
                {canEditModule("applicants") && !isOrgExecutive && (
                  <li className="nav-item">
                    <Link to="/applicants/create" className="nav-link">
                      <i className="bx bx-user-plus me-2"></i>
                      {props.t("Create Applicant")}
                    </Link>
                  </li>
                )}

                <li className="nav-item">
                  <Link to="/applicants" className="nav-link">
                    <i className="bx bx-user-check me-2"></i>
                    {props.t("Applicant Details")}
                        </Link>
                </li>

                {/* Reports dropdown */}
                {canAccessNav("reports") && (
                  <li className="nav-item dropdown">
                    <Link
                      className="nav-link dropdown-toggle arrow-none"
                      to="/#"
                      onClick={(e) => {
                        e.preventDefault();
                        setReports(!reports);
                      }}
                    >
                      <i className="bx bx-file-find me-2"></i>
                      {props.t("Reports")} <div className="arrow-down"></div>
                    </Link>
                    <div className={classname("dropdown-menu", { show: reports })}>
                      <Link to="/reports/applicant-details" className="dropdown-item">
                        {props.t("Applicant Details")}
                      </Link>
                      <Link to="/reports/total-financial-assistance" className="dropdown-item">
                        {props.t("Total Assistance")}
                      </Link>
                      <Link to="/reports/financial-assistance" className="dropdown-item">
                        {props.t("Financial Assistance")}
                      </Link>
                      <Link to="/reports/food-assistance" className="dropdown-item">
                        {props.t("Food Assistance")}
                      </Link>
                      <Link to="/reports/home-visits" className="dropdown-item">
                        {props.t("Home Visits")}
                      </Link>
                      <Link to="/reports/applicant-programs" className="dropdown-item">
                        {props.t("Applicant Programs")}
                      </Link>
                      <Link to="/reports/relationship-report" className="dropdown-item">
                        {props.t("Relationship Report")}
                      </Link>
                      <Link to="/reports/skills-matrix" className="dropdown-item">
                        {props.t("Applicant Skills")}
                      </Link>
                    </div>
                  </li>
                )}

                {/* Lookup setup */}
                {canAccessNav("lookups") && (
                  <li className="nav-item">
                    <Link to="/lookups" className="nav-link">
                      <i className="bx bx-list-ul me-2"></i>
                      {props.t("Lookup Setup")}
                    </Link>
                  </li>
                )}

                {canAccessNav("filemanager") && (
                  <li className="nav-item">
                    <Link to="/FileManager" className="nav-link">
                      <i className="bx bx-folder me-2"></i>
                      {props.t("File Manager")}
                        </Link>
                  </li>
                )}

                {canAccessNav("chat") && (
                  <li className="nav-item">
                    <Link to="/chat" className="nav-link">
                      <i className="bx bx-chat me-2"></i>
                      {props.t("Chat")}
                          </Link>
                  </li>
                )}
              </ul>
            </Collapse>
          </nav>
        </div>
      </div>
    </React.Fragment>
  );
};

Navbar.propTypes = {
  leftMenu: PropTypes.any,
  location: PropTypes.any,
  menuOpen: PropTypes.any,
  t: PropTypes.any,
};

const mapStatetoProps = (state) => {
  const { leftMenu } = state.Layout;
  return { leftMenu };
};

export default withRouter(
  connect(mapStatetoProps, {})(withTranslation()(Navbar))
);
