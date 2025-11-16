import {
  LOGIN_USER,
  LOGIN_SUCCESS,
  LOGOUT_USER,
  LOGOUT_USER_SUCCESS,
  API_ERROR,
  LOGIN_ERROR,
} from "./actionTypes";

const initialState = {
  error: "",
  loading: false,
  success: false,
};

const login = (state = initialState, action) => {
  switch (action.type) {
    case LOGIN_USER:
      return {
        ...state,
        loading: true,
        success: false,
        error: "",
      };

    case LOGIN_SUCCESS:
      return {
        ...state,
        loading: false,
        success: true,
        error: "",
      };

    case LOGIN_ERROR:
      return {
        ...state,
        loading: false,
        success: false,
        error: action.payload,
      };

    case API_ERROR:
      return {
        ...state,
        error: action.payload,
        loading: false,
        success: false,
      };

    case LOGOUT_USER:
    case LOGOUT_USER_SUCCESS:
      return { ...initialState };

    default:
      return state;
  }
};

export default login;
