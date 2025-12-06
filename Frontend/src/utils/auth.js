export const setAuth = (token, user) => {
  localStorage.setItem("token", token);
  localStorage.setItem("user", JSON.stringify(user));
};

export const getToken = () => {
  return localStorage.getItem("token");
};

export const getUser = () => {
  return JSON.parse(localStorage.getItem("user"));
};

// Create a custom event for logout that can be caught by React components
export const logout = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  // Dispatch custom event for React Router navigation
  window.dispatchEvent(new CustomEvent('auth:logout'));
};

// For manual logout where we have history access
export const logoutWithRedirect = (history) => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  if (history) {
    history.push('/login');
  } else {
    window.dispatchEvent(new CustomEvent('auth:logout'));
  }
};
