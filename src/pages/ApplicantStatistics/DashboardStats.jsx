import React, { useEffect, useState } from "react";
import { Row, Col, Card, CardBody, Spinner } from "reactstrap";
import axiosApi from "../../helpers/api_helper";
import { API_BASE_URL } from "../../helpers/url_helper";

const DashboardStats = () => {
  const [stats, setStats] = useState({
    projects: 0,
    openTasks: 0,
    openBugs: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        
        // Fetch all projects
        const projectsResponse = await axiosApi.get(`${API_BASE_URL}/appManager/projects`);
        const projects = projectsResponse.data || [];
        const projectCount = projects.length;

        // Fetch all bugs
        const bugsResponse = await axiosApi.get(`${API_BASE_URL}/appManager/bugs`);
        const bugs = bugsResponse.data || [];
        
        // Count open tasks (type="Task" and status !== "closed")
        const openTasks = bugs.filter(
          (bug) =>
            (bug.type || "").toLowerCase() === "task" &&
            (bug.status || "").toLowerCase() !== "closed"
        ).length;

        // Count open bugs (status !== "closed")
        const openBugs = bugs.filter(
          (bug) => (bug.status || "").toLowerCase() !== "closed"
        ).length;

        setStats({
          projects: projectCount,
          openTasks,
          openBugs,
        });
      } catch (error) {
        console.error("Error fetching dashboard stats:", error);
        // Set defaults on error
        setStats({
          projects: 0,
          openTasks: 0,
          openBugs: 0,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const cards = [
    {
      title: "Projects",
      value: stats.projects,
      icon: "bx bx-folder",
      color: "primary",
      gradient: "linear-gradient(135deg, #556ee6 0%, #6f42c1 100%)",
      iconBg: "rgba(255, 255, 255, 0.2)",
    },
    {
      title: "Bugs & Tasks",
      value: stats.openBugs + stats.openTasks,
      icon: "bx bx-bug",
      color: "danger",
      gradient: "linear-gradient(135deg, #f46a6a 0%, #ee5a6f 100%)",
      iconBg: "rgba(255, 255, 255, 0.2)",
    },
  ];

  return (
    <Row className="mb-4">
      {cards.map((card, index) => (
        <Col xl={6} md={6} sm={12} key={index} className="mb-3">
          <Card 
            className="h-100 border-0 shadow-sm" 
            style={{ 
              borderRadius: '12px',
              overflow: 'hidden',
              transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 8px 16px rgba(0, 0, 0, 0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
            }}
          >
            <CardBody 
              style={{ 
                background: card.gradient,
                padding: '1.5rem',
                minHeight: '120px'
              }}
            >
              {loading ? (
                <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "80px" }}>
                  <Spinner size="sm" style={{ color: 'white' }} />
                </div>
              ) : (
                <div className="d-flex align-items-center justify-content-between">
                  <div className="flex-grow-1">
                    <p 
                      className="mb-2 fw-medium text-uppercase" 
                      style={{ 
                        color: 'rgba(255, 255, 255, 0.8)',
                        fontSize: '0.75rem',
                        letterSpacing: '0.5px'
                      }}
                    >
                      {card.title}
                    </p>
                    <h2 
                      className="mb-0 fw-bold" 
                      style={{ 
                        color: 'white',
                        fontSize: '2.5rem'
                      }}
                    >
                      {card.value}
                    </h2>
                  </div>
                  <div 
                    className="d-flex align-items-center justify-content-center"
                    style={{
                      width: '64px',
                      height: '64px',
                      borderRadius: '12px',
                      background: card.iconBg,
                      backdropFilter: 'blur(10px)',
                    }}
                  >
                    <i 
                      className={card.icon} 
                      style={{ 
                        fontSize: '28px',
                        color: 'white'
                      }} 
                    />
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

export default DashboardStats;

