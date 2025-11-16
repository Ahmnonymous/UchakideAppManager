// API Base URL for client calls should be empty. The axios instance already
// includes the /api prefix via baseURL (from VITE_API_URL). Keep this as
// an empty string so `${API_BASE_URL}/route` resolves to `/route`.
export const API_BASE_URL = "";

// Absolute base for non-axios navigation (anchors/iframes/window.open)
// In dev, prefers VITE_API_URL if provided (e.g., http://localhost:5000/api)
// In prod, defaults to same-origin '/api'
const envRef =
  typeof import.meta !== "undefined" && import.meta.env ? import.meta.env : undefined;

export const API_STREAM_BASE_URL =
  (envRef && envRef.VITE_API_URL) ||
  (envRef && envRef.DEV ? "http://localhost:5000/api" : "/api");

//REGISTER
export const POST_FAKE_REGISTER = "/post-fake-register";

//LOGIN
export const POST_FAKE_LOGIN = "/post-fake-login";
export const POST_FAKE_JWT_LOGIN = "/post-jwt-login";
export const POST_FAKE_PASSWORD_FORGET = "/fake-forget-pwd";
export const POST_FAKE_JWT_PASSWORD_FORGET = "/jwt-forget-pwd";
export const SOCIAL_LOGIN = "/social-login";

//PROFILE
export const POST_EDIT_JWT_PROFILE = "/post-jwt-profile";
export const POST_EDIT_PROFILE = "/post-fake-profile";

//PRODUCTS
export const GET_PRODUCTS = "/products";
export const GET_PRODUCTS_DETAIL = "/product";

//Mails
export const GET_MAILS_LIST = "/mailslists";
export const SELECT_FOLDER = "/folders";
export const GET_SELECTED_MAILS = "/selectedmails";
export const SET_FOLDER_SELECTED_MAILS = "/setfolderonmail";
export const DELETE_MAIL = "/delete/mail";
export const TRASH_MAIL = "/trash/mail";
export const STARED_MAIL = "/stared/mail";
export const GET_MAILS_ID = "/mail:id"

//CALENDER
export const GET_EVENTS = "/events";
export const ADD_NEW_EVENT = "/add/event";
export const UPDATE_EVENT = "/update/event";
export const DELETE_EVENT = "/delete/event";
export const GET_CATEGORIES = "/categories";

//CHATS
export const GET_CHATS = "/chats";
export const GET_GROUPS = "/groups";
export const GET_CONTACTS = "/contacts";
export const GET_MESSAGES = "/messages";
export const ADD_MESSAGE = "/add/messages";
export const DELETE_MESSAGE = "/delete/message";

//ORDERS
export const GET_ORDERS = "/orders";
export const ADD_NEW_ORDER = "/add/order";
export const UPDATE_ORDER = "/update/order";
export const DELETE_ORDER = "/delete/order";

//CART DATA
export const GET_CART_DATA = "/cart";

//CUSTOMERS
export const GET_CUSTOMERS = "/customers";
export const ADD_NEW_CUSTOMER = "/add/customer";
export const UPDATE_CUSTOMER = "/update/customer";
export const DELETE_CUSTOMER = "/delete/customer";

//SHOPS
export const GET_SHOPS = "/shops";

//CRYPTO
export const GET_WALLET = "/wallet";
export const GET_CRYPTO_ORDERS = "/crypto/orders";
export const GET_CRYPTO_PRODUCTS = "/crypto-products";

//INVOICES
export const GET_INVOICES = "/invoices";
export const GET_INVOICE_DETAIL = "/invoice";

// JOBS
export const GET_JOB_LIST = "/jobs";
export const ADD_NEW_JOB_LIST = "/add/job";
export const UPDATE_JOB_LIST = "/update/job";
export const DELETE_JOB_LIST = "/delete/job";

//Apply Jobs
export const GET_APPLY_JOB = "/jobApply";
export const DELETE_APPLY_JOB = "add/applyjob";

//PROJECTS
export const GET_PROJECTS = "/projects";
export const GET_PROJECT_DETAIL = "/project";
export const UPDATE_PROJECT = "/update/project";
export const DELETE_PROJECT = "/delete/project";

//TASKS
export const GET_TASKS = "/tasks";
export const DELETE_KANBAN = "/delete/tasks"
export const ADD_CARD_DATA = "/add/tasks"
export const UPDATE_CARD_DATA = "/update/tasks"

//CONTACTS
export const GET_USERS = "/users";
export const GET_USER_PROFILE = "/user";
export const ADD_NEW_USER = "/add/user";
export const UPDATE_USER = "/update/user";
export const DELETE_USER = "/delete/user";

//Blog
export const GET_VISITOR_DATA = "/visitor-data";

//dashboard charts data
export const TOP_SELLING_DATA = "/top-selling-data";
export const GET_DASHBOARD_EMAILCHART = "/dashboard/email-chart";

//dashboard crypto
export const GET_WALLET_DATA = "/wallet-balance-data";

//dashboard jobs
export const GET_STATISTICS_DATA = "/dashboard/statistics-applications";

export const GET_EARNING_DATA = "/earning-charts-data";

export const GET_PRODUCT_COMMENTS = "/comments-product";

export const ON_LIKNE_COMMENT = "/comments-product-action";

export const ON_ADD_REPLY = "/comments-product-add-reply";

export const ON_ADD_COMMENT = "/comments-product-add-comment";

// REPORTS
export const GET_APPLICANT_DETAILS_REPORT = `${API_BASE_URL}/reports/applicant-details`;
export const GET_TOTAL_FINANCIAL_ASSISTANCE_REPORT = `${API_BASE_URL}/reports/total-financial-assistance`;
export const GET_FINANCIAL_ASSISTANCE_REPORT = `${API_BASE_URL}/reports/financial-assistance`;
export const GET_FOOD_ASSISTANCE_REPORT = `${API_BASE_URL}/reports/food-assistance`;
export const GET_HOME_VISITS_REPORT = `${API_BASE_URL}/reports/home-visits`;
export const GET_APPLICANT_PROGRAMS_REPORT = `${API_BASE_URL}/reports/applicant-programs`;
export const GET_RELATIONSHIP_REPORT = `${API_BASE_URL}/reports/relationship-report`;
export const GET_SKILLS_MATRIX_REPORT = `${API_BASE_URL}/reports/skills-matrix`;
