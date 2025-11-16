import React, { useEffect, useMemo, useState } from "react";
import { Card, CardBody, Col, Spinner } from "reactstrap";
import axiosApi from "../../helpers/api_helper";
import { API_BASE_URL } from "../../helpers/url_helper";

const CandidateSection = () => {
  const [hadiths, setHadiths] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const fetchHadiths = async () => {
      try {
        const response = await axiosApi.get(`${API_BASE_URL}/lookup/Hadith`);
        if (isMounted) {
          setHadiths(response.data || []);
        }
      } catch (err) {
        console.error("Failed to load hadith", err);
        if (isMounted) {
          setError(
            err?.response?.data?.error ||
              "Unable to load Hadith at the moment. Please try again later."
          );
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchHadiths();

    return () => {
      isMounted = false;
    };
  }, []);

  const scrollItems = useMemo(() => {
    if (!hadiths.length) return [];
    // Duplicate the list so that the loop feels continuous during the scroll
    return [...hadiths, ...hadiths];
  }, [hadiths]);

  const scrollDuration = useMemo(() => {
    const baseDurationPerItem = 10; // seconds per entry for a relaxed pace
    const itemCount = Math.max(scrollItems.length, 1);
    return `${itemCount * baseDurationPerItem}s`;
  }, [scrollItems.length]);

  // Layout/theming notes:
  // - `Col` + `Card` use flex stretch helpers so the Hadith panel naturally matches the
  //   height of neighbouring cards (e.g. StatisticsApplications) without touching that component.
  // - All palette values leverage Bootstrap CSS variables, keeping light/dark themes in sync.
  // - The scroll container consumes remaining space via flex, allowing internal overflow.
  return (
    <>
      <Col lg={4} className="d-flex align-items-stretch">
        <Card className="hadith-card border-0 shadow-sm flex-fill d-flex flex-column">
          <CardBody className="p-4 d-flex flex-column flex-grow-1" style={{ minHeight: 0 }}>
            <div className="d-flex align-items-center justify-content-between mb-4">
              <div>
                {/* <span className="badge bg-soft-primary text-primary fw-semibold">
                  Daily Hadith
                </span> */}
                <h5 className="mb-0 mt-2 fw-semibold">Hadith</h5>
                <p className="text-muted mb-0">
                Reflections & Guidance
                </p>
              </div>
              <div className="hadith-icon-wrapper">
                <i className="bx bxs-book-open"></i>
              </div>
            </div>

            <div
              className={`hadith-scroll ${isPaused ? "paused" : ""}`}
              onMouseEnter={() => setIsPaused(true)}
              onMouseLeave={() => setIsPaused(false)}
              style={{ "--scroll-duration": scrollDuration }}
            >
              {loading ? (
                <div className="hadith-state d-flex flex-column align-items-center justify-content-center">
                  <Spinner color="primary" size="sm" />
                  <p className="text-muted mt-2 mb-0">Loading inspirations...</p>
                </div>
              ) : error ? (
                <div className="hadith-state text-center text-danger">
                  <i className="bx bx-error-circle fs-3 d-block mb-2"></i>
                  <p className="mb-0">{error}</p>
                </div>
              ) : !hadiths.length ? (
                <div className="hadith-state text-center text-muted">
                  <i className="bx bx-info-circle fs-3 d-block mb-2"></i>
                  <p className="mb-0">No Hadith found. Please add one to begin.</p>
                </div>
              ) : (
                <div className="scroll-content">
                  {scrollItems.map((item, index) => (
                    <div key={`${item.id || index}-${index}`} className="hadith-entry">
                      <span className="arabic-text">{item.hadith_arabic}</span>
                      <span className="divider"></span>
                      <span className="english-text text-muted">
                        {item.hadith_english}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardBody>
        </Card>
      </Col>

      <style jsx="true">{`
        .hadith-card {
          background: linear-gradient(
              135deg,
              rgba(var(--bs-primary-rgb), 0.08),
              rgba(var(--bs-primary-rgb), 0.02)
            )
            var(--bs-card-bg);
          position: relative;
          border: 1px solid rgba(var(--bs-primary-rgb), 0.08);
          color: var(--bs-body-color);
        }

        .hadith-icon-wrapper {
          width: 40px;
          height: 40px;
          border-radius: 12px;
          display: grid;
          place-items: center;
          background: rgba(var(--bs-primary-rgb), 0.12);
          color: rgb(var(--bs-primary-rgb));
          font-size: 28px;
        }

        .hadith-scroll {
          --scroll-duration: 60s;
          position: relative;
          overflow: hidden;
          flex: 0 0 auto;
          height: clamp(326px, 28vh, 260px); /* shows roughly two entries while remaining responsive */
          border-radius: 12px;
          background: rgba(var(--bs-primary-rgb), 0.06);
          padding: 1.25rem;
          box-shadow: inset 0 0 0 1px rgba(var(--bs-primary-rgb), 0.08);
        }

        .scroll-content {
          display: flex;
          flex-direction: column;
          gap: 2rem;
          animation: hadithScroll var(--scroll-duration) linear infinite;
          will-change: transform;
        }

        .hadith-scroll.paused .scroll-content {
          animation-play-state: paused;
        }

        .hadith-entry {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 0.75rem;
          padding-bottom: 1rem;
          border-bottom: 1px dashed rgba(85, 110, 230, 0.2);
        }

        .hadith-entry:last-child {
          border-bottom: none;
        }

        .arabic-text {
          font-size: 1.3rem;
          font-weight: 600;
          color: var(--bs-body-color);
          line-height: 1.6;
          font-family: "Scheherazade New", "Amiri", "Times New Roman", serif;
          text-align: right;
          width: 100%;
        }

        .english-text {
          font-size: 0.95rem;
          line-height: 1.7;
          font-weight: 500;
        }

        .divider {
          display: inline-block;
          height: 3px;
          width: 52px;
          background: linear-gradient(
            90deg,
            rgba(var(--bs-primary-rgb), 0.7),
            transparent
          );
          border-radius: 999px;
        }

        .hadith-state {
          min-height: 100%;
        }

        @keyframes hadithScroll {
          0% {
            transform: translateY(0);
          }
          100% {
            transform: translateY(-50%);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .scroll-content {
            animation-duration: calc(var(--scroll-duration) * 2);
          }
        }

        @media (max-width: 1199px) {
          .hadith-entry {
            gap: 0.6rem;
          }
        }
      `}</style>
    </>
  );
};

export default CandidateSection;