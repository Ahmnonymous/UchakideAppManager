import {
  LOGIN_USER,
  LOGIN_SUCCESS,
  LOGIN_ERROR,
  LOGOUT_USER,
  LOGOUT_USER_SUCCESS,
  API_ERROR,
} from "./actionTypes";

// Trigger login saga/thunk
export const loginUser = (user, history) => {
  return {
    type: LOGIN_USER,
    payload: { ...user, history },
  };
};

// Dispatch on login success
export const loginSuccess = (user, token) => {
  return {
    type: LOGIN_SUCCESS,
    payload: { user, token },
  };
};

// Dispatch on login failure
export const loginError = (error) => {
  return {
    type: LOGIN_ERROR,
    payload: error,
  };
};

// Logout user
export const logoutUser = (history) => {
  return {
    type: LOGOUT_USER,
    payload: { history },
  };
};

// Clear errors
export const apiError = (error) => {
  return {
    type: API_ERROR,
    payload: error,
  };
};
