// @flow
import {
  CHANGE_LAYOUT,
  CHANGE_LAYOUT_WIDTH,
  CHANGE_SIDEBAR_THEME,
  CHANGE_SIDEBAR_TYPE,
  CHANGE_TOPBAR_THEME,
  SHOW_RIGHT_SIDEBAR,
  CHANGE_SIDEBAR_THEME_IMAGE,
  CHANGE_PRELOADER,
  TOGGLE_LEFTMENU,
  SHOW_SIDEBAR,
  CHANGE_LAYOUT_MODE
} from "./actionTypes"

//constants
import {
  layoutTypes,
  layoutModeTypes,
  layoutWidthTypes,
  topBarThemeTypes,
  leftBarThemeImageTypes,
  leftSidebarTypes,
  leftSideBarThemeTypes,
} from "../../constants/layout";

const STORAGE_KEY = "ua_layout_preferences";

const loadPersistedLayout = () => {
  if (typeof window === "undefined" || !window.sessionStorage) return {};
  try {
    const stored = window.sessionStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch (error) {
    console.warn("Failed to load layout preferences from sessionStorage:", error);
    return {};
  }
};

const persistLayoutState = (state) => {
  if (typeof window === "undefined" || !window.sessionStorage) return;
  try {
    const snapshot = {
      layoutType: state.layoutType,
      layoutModeType: state.layoutModeType,
      layoutWidth: state.layoutWidth,
      leftSideBarTheme: state.leftSideBarTheme,
      leftSideBarThemeImage: state.leftSideBarThemeImage,
      leftSideBarType: state.leftSideBarType,
      topbarTheme: state.topbarTheme,
    };
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
  } catch (error) {
    console.warn("Failed to persist layout preferences to sessionStorage:", error);
  }
};

// Determine default mode based on environment (Vite: import.meta.env.MODE)
const DEFAULT_MODE = (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.MODE === "development")
  ? layoutModeTypes.DARK
  : layoutModeTypes.LIGHT;

const persistedLayout = loadPersistedLayout();

const INIT_STATE = {
  layoutType: persistedLayout.layoutType || layoutTypes.VERTICAL,
  layoutModeType: persistedLayout.layoutModeType || DEFAULT_MODE,
  layoutWidth: persistedLayout.layoutWidth || layoutWidthTypes.FLUID,
  leftSideBarTheme: persistedLayout.leftSideBarTheme || leftSideBarThemeTypes.DARK,
  leftSideBarThemeImage: persistedLayout.leftSideBarThemeImage || leftBarThemeImageTypes.NONE,
  leftSideBarType: persistedLayout.leftSideBarType || leftSidebarTypes.DEFAULT,
  topbarTheme:
    persistedLayout.topbarTheme ||
    ( (persistedLayout.layoutModeType || DEFAULT_MODE) === layoutModeTypes.DARK
      ? topBarThemeTypes.DARK
      : topBarThemeTypes.LIGHT ),
  isPreloader: false,
  showRightSidebar: false,
  isMobile: false,
  showSidebar: true,
  leftMenu: false,
};

const Layout = (state = INIT_STATE, action) => {
  switch (action.type) {
    case CHANGE_LAYOUT: {
      const newState = {
        ...state,
        layoutType: action.payload,
      };
      persistLayoutState(newState);
      return newState;
    }
    case CHANGE_PRELOADER:
      return {
        ...state,
        isPreloader: action.payload,
      }
    case CHANGE_LAYOUT_MODE: {
      const newState = {
        ...state,
        layoutModeType: action.payload,
        topbarTheme:
          state.topbarTheme === topBarThemeTypes.DARK || state.topbarTheme === topBarThemeTypes.LIGHT
            ? (action.payload === layoutModeTypes.DARK ? topBarThemeTypes.DARK : topBarThemeTypes.LIGHT)
            : state.topbarTheme,
      };
      persistLayoutState(newState);
      return newState;
    }
    case CHANGE_LAYOUT_WIDTH: {
      const newState = {
        ...state,
        layoutWidth: action.payload,
      };
      persistLayoutState(newState);
      return newState;
    }
    case CHANGE_SIDEBAR_THEME: {
      const newState = {
        ...state,
        leftSideBarTheme: action.payload,
      };
      persistLayoutState(newState);
      return newState;
    }
    case CHANGE_SIDEBAR_THEME_IMAGE: {
      const newState = {
        ...state,
        leftSideBarThemeImage: action.payload,
      };
      persistLayoutState(newState);
      return newState;
    }
    case CHANGE_SIDEBAR_TYPE: {
      const newState = {
        ...state,
        leftSideBarType: action.payload.sidebarType,
      };
      persistLayoutState(newState);
      return newState;
    }
    case CHANGE_TOPBAR_THEME: {
      const newState = {
        ...state,
        topbarTheme: action.payload,
      };
      persistLayoutState(newState);
      return newState;
    }
    case SHOW_RIGHT_SIDEBAR:
      return {
        ...state,
        showRightSidebar: action.payload,
      }
    case SHOW_SIDEBAR:
      return {
        ...state,
        showSidebar: action.payload,
      }
    case TOGGLE_LEFTMENU:
      return {
        ...state,
        leftMenu: action.payload,
      }

    default:
      return state
  }
}

export default Layout
