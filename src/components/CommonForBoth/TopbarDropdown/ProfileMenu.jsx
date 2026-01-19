import React, { useState, useEffect, useCallback } from "react";
import PropTypes from "prop-types";
import {
  Dropdown,
  DropdownToggle,
  DropdownMenu,
  DropdownItem,
} from "reactstrap";
import axiosApi from "../../../helpers/api_helper";
import { API_BASE_URL } from "../../../helpers/url_helper";

//i18n
import { withTranslation } from "react-i18next";

// Redux
import { connect } from "react-redux";
import { Link } from "react-router-dom";
import withRouter from "../../Common/withRouter";

// users
import user1 from "../../../assets/images/users/avatar-1.jpg";

const ProfileMenu = (props) => {
  // Declare a new state variable, which we'll call "menu"
  const [menu, setMenu] = useState(false);

  const [username, setusername] = useState("Admin");
  const [userId, setUserId] = useState(null);
  const [userAvatar, setUserAvatar] = useState(null);
  const [userFullName, setUserFullName] = useState("");
  const [pwdOpen, setPwdOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [pwdError, setPwdError] = useState("");
  const [pwdSuccess, setPwdSuccess] = useState("");

  const fetchEmployeeAvatar = useCallback(async (employeeId) => {
    // UchakideAppManager doesn't have an employee endpoint
    // This functionality is disabled - using default avatar/initial
    try {
      // Optionally, if you want to fetch user data instead:
      // const response = await axiosApi.get(`${API_BASE_URL}/appManager/users/${employeeId}`);
      // const user = response.data;
      // if (user?.name) {
      //   setUserFullName(user.name);
      // }
    } catch (error) {
      // Silently fail - use default avatar
      console.debug("Employee/user avatar fetch disabled for UchakideAppManager");
    }
  }, []);

  useEffect(() => {
    // Get user data from UmmahAidUser in localStorage
    const userDataStr = localStorage.getItem("UmmahAidUser");
    if (userDataStr) {
      try {
        const userData = JSON.parse(userDataStr);
        setusername(userData.username || userData.email || "Admin");
        setUserId(userData.user_id || userData.id);
        
        // Fetch employee details to get avatar
        if (userData.user_id || userData.id) {
          fetchEmployeeAvatar(userData.user_id || userData.id);
        }
      } catch (error) {
        console.error("Error parsing user data:", error);
      }
    }
    // Fallback to authUser if UmmahAidUser not found
    else if (localStorage.getItem("authUser")) {
      if (import.meta.env.VITE_APP_DEFAULTAUTH === "firebase") {
        const obj = JSON.parse(localStorage.getItem("authUser"));
        setusername(obj.email);
      } else if (
        import.meta.env.VITE_APP_DEFAULTAUTH === "fake" ||
        import.meta.env.VITE_APP_DEFAULTAUTH === "jwt"
      ) {
        const obj = JSON.parse(localStorage.getItem("authUser"));
        setusername(obj.username);
      }
    }
  }, [props.success, userId, fetchEmployeeAvatar]);

  // Listen for avatar update events
  useEffect(() => {
    const handleAvatarUpdate = () => {
      // Only refetch if we have a userId (is the logged-in user)
      if (userId) {
        fetchEmployeeAvatar(userId);
      }
    };

    window.addEventListener("employeeAvatarUpdated", handleAvatarUpdate);
    
    return () => {
      window.removeEventListener("employeeAvatarUpdated", handleAvatarUpdate);
    };
  }, [userId, fetchEmployeeAvatar]);

  const userInitial = (username || "").trim().charAt(0).toUpperCase() || "U";

  const handleChangePassword = async () => {
    setPwdError("");
    if (!newPassword || !confirmPassword) {
      setPwdError("Please enter and confirm the new password.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwdError("Passwords do not match.");
      return;
    }
    if (!userId) {
      setPwdError("Unable to resolve current user id.");
      return;
    }
    try {
      setSaving(true);
      await axiosApi.put(`${API_BASE_URL}/appManager/users/${userId}`, { password: newPassword });
      setPwdOpen(false);
      setNewPassword("");
      setConfirmPassword("");
      setPwdSuccess("Password has been updated successfully.");
      setTimeout(() => setPwdSuccess(""), 3000);
    } catch (e) {
      setPwdError(e?.response?.data?.error || "Unable to change password");
    } finally {
      setSaving(false);
    }
  };

  return (
    <React.Fragment>
      <Dropdown
        isOpen={menu}
        toggle={() => setMenu(!menu)}
        className="d-inline-block"
      >
        <DropdownToggle
          className="btn header-item "
          id="page-header-user-dropdown"
          tag="button"
        >
          <span
            className="rounded-circle d-inline-flex align-items-center justify-content-center bg-primary text-white"
            style={{ width: 36, height: 36, fontWeight: 600 }}
          >
            {userInitial}
          </span>
          <span className="d-none d-xl-inline-block ms-2 me-1">{username}</span>
          <i className="mdi mdi-chevron-down d-none d-xl-inline-block" />
        </DropdownToggle>
        <DropdownMenu className="dropdown-menu-end">
          <DropdownItem onClick={() => setPwdOpen(true)}>
            <i className="bx bx-lock-alt font-size-16 align-middle me-1" />
            {props.t("Change Password")}
          </DropdownItem>
          <div className="dropdown-divider" />
          <Link to="/logout" className="dropdown-item">
            <i className="bx bx-power-off font-size-16 align-middle me-1 text-danger" />
            <span>{props.t("Logout")}</span>
          </Link>
        </DropdownMenu>
      </Dropdown>

      {/* Change Password Modal */}
      <div className={`modal fade ${pwdOpen ? "show d-block" : ""}`} tabIndex="-1" role="dialog" style={{ background: pwdOpen ? "rgba(0,0,0,.5)" : "transparent" }}>
        <div className="modal-dialog modal-dialog-centered" role="document">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Change Password</h5>
              <button type="button" className="btn-close" aria-label="Close" onClick={() => setPwdOpen(false)}></button>
            </div>
            <div className="modal-body">
              {pwdError ? <div className="alert alert-warning">{pwdError}</div> : null}
              <div className="mb-3">
                <label className="form-label">New Password</label>
                <input type="password" className="form-control" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} autoComplete="new-password" />
              </div>
              <div className="mb-3">
                <label className="form-label">Confirm Password</label>
                <input type="password" className="form-control" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} autoComplete="new-password" />
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-light" onClick={() => setPwdOpen(false)}>
                <i className="bx bx-x me-1" /> Cancel
              </button>
              <button type="button" className="btn btn-primary" onClick={handleChangePassword} disabled={saving || !newPassword || !confirmPassword}>
                {saving ? (<><span className="spinner-border spinner-border-sm me-2" role="status" /> Saving...</>) : (<><i className="bx bx-save me-1" /> Save</>)}
              </button>
            </div>
          </div>
        </div>
      </div>

      {pwdSuccess ? (
        <div
          className="position-fixed top-0 end-0 p-3"
          style={{ zIndex: 1060, minWidth: "300px", maxWidth: "500px" }}
        >
          <div
            className="alert alert-success alert-dismissible fade show shadow-lg"
            role="alert"
            style={{ backgroundColor: "#d4edda", border: "1px solid #c3e6cb", color: "#000" }}
          >
            <i className="mdi mdi-check-all me-2" />
            {pwdSuccess}
            <button type="button" className="btn-close" onClick={() => setPwdSuccess("")}></button>
          </div>
        </div>
      ) : null}
    </React.Fragment>
  );
};

ProfileMenu.propTypes = {
  success: PropTypes.any,
  t: PropTypes.any,
};

const mapStatetoProps = (state) => {
  const { error, success } = state.Profile;
  return { error, success };
};

export default withRouter(
  connect(mapStatetoProps, {})(withTranslation()(ProfileMenu))
);
