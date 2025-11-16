import React, { useEffect, useState } from "react";
import { Card, CardBody, Nav, NavItem, NavLink, TabContent, TabPane } from "reactstrap";
import classnames from "classnames";
import PaymentsTab from "./tabs/PaymentsTab";
import BugsTab from "./tabs/BugsTab";
import ReportsTab from "./tabs/ReportsTab";
import TablesTab from "./tabs/TablesTab";
import MenusTab from "./tabs/MenusTab";
import AccessTab from "./tabs/AccessTab";
import RolesTab from "./tabs/RolesTab";

const DetailTabs = ({
  projectId,
  project,
  payments,
  bugs,
  reports,
  attachments,
  roles,
  tables,
  menus,
  roleMenuAccess,
  onRefresh,
  showAlert,
}) => {
  const [activeTab, setActiveTab] = useState(() => {
    try {
      return localStorage.getItem("projects.activeTab") || "tables";
    } catch {
      return "tables";
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem("projects.activeTab", activeTab);
    } catch {}
  }, [activeTab]);

  const tabs = [
    { id: "tables", label: "Tables" },
    { id: "reports", label: "Reports" },
    { id: "roles", label: "Roles" },
    { id: "menus", label: "Menus" },
    { id: "access", label: "Access" },
    { id: "bugs", label: "Bugs & Tasks" },
    { id: "payments", label: "Payments" },
  ];

  return (
    <Card>
      <CardBody className="py-4">
        <Nav pills className="nav-pills-custom mb-1 d-flex flex-wrap border-bottom">
          {tabs.map((tab) => (
            <NavItem key={tab.id} className="me-2 mb-3">
              <NavLink
                className={classnames({ active: activeTab === tab.id })}
                onClick={() => setActiveTab(tab.id)}
                style={{ cursor: "pointer", padding: "0.35rem 0.65rem", fontSize: "0.8rem" }}
              >
                {tab.label}
              </NavLink>
            </NavItem>
          ))}
        </Nav>

        <TabContent activeTab={activeTab} className="mt-3">
          <TabPane tabId="payments">
            <PaymentsTab
              projectId={projectId}
              payments={payments}
              onRefresh={onRefresh}
              showAlert={showAlert}
            />
          </TabPane>
          <TabPane tabId="bugs">
            <BugsTab
              projectId={projectId}
              bugs={bugs}
              menus={menus}
              onRefresh={onRefresh}
              showAlert={showAlert}
            />
          </TabPane>
          <TabPane tabId="reports">
            <ReportsTab
              projectId={projectId}
              reports={reports}
              tables={tables}
              onRefresh={onRefresh}
              showAlert={showAlert}
            />
          </TabPane>
          <TabPane tabId="access">
            <AccessTab
              projectId={projectId}
              roles={roles}
              menus={menus}
              accessList={roleMenuAccess}
              onRefresh={onRefresh}
              showAlert={showAlert}
            />
          </TabPane>
          <TabPane tabId="menus">
            <MenusTab
              projectId={projectId}
              menus={menus}
              onRefresh={onRefresh}
              showAlert={showAlert}
            />
          </TabPane>
          <TabPane tabId="roles">
            <RolesTab
              projectId={projectId}
              roles={roles}
              onRefresh={onRefresh}
              showAlert={showAlert}
            />
          </TabPane>


          <TabPane tabId="tables">
            <TablesTab
              projectId={projectId}
              tables={tables}
              onRefresh={onRefresh}
              showAlert={showAlert}
            />
          </TabPane>
        </TabContent>
      </CardBody>
    </Card>
  );
};

export default DetailTabs;


