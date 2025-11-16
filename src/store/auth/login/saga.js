import { call, put, takeEvery } from "redux-saga/effects";
import { LOGIN_USER, LOGOUT_USER } from "./actionTypes";
import { loginSuccess, loginError } from "./actions";
// import { login, logout } from "D:/WORK/LUQMAN/WelfareApp_react/welfare-app/src/helpers/jwt-token-access/auth-token-header";
import { login, logout } from "./../../../helpers/jwt-token-access/auth-token-header";

function* loginUser({ payload: { username, password } }) {
  try {
    console.log("🔐 Login saga started for user:", username);
    const response = yield call(login, username, password);
    console.log("✅ Login response received:", response);
    
    // Use userInfo instead of employee, fallback to user if userInfo not available
    const userData = response.userInfo || response.user || response.employee;
    console.log("👤 User data to dispatch:", userData);
    
    yield put(loginSuccess(userData, response.token));
    console.log("🚀 Login success action dispatched");
  } catch (error) {
    console.error("❌ Login error:", error);
    yield put(loginError(error.response?.data?.msg || "Login failed"));
  }
}

function* logoutUser({ payload: { history } }) {
  try {
    console.log("🔴 Logout saga started");
    yield call(logout);
    console.log("✅ Logout complete, redirecting to login");
    // Redirect to login page
    if (history) {
      history("/login");
    } else {
      // Fallback if history is not provided
      window.location.href = "/login";
    }
  } catch (error) {
    console.error("❌ Logout error:", error);
    // Even if there's an error, redirect to login
    window.location.href = "/login";
  }
}

function* authSaga() {
  yield takeEvery(LOGIN_USER, loginUser);
  yield takeEvery(LOGOUT_USER, logoutUser);
}

export default authSaga;
