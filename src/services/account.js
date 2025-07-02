const backendBaseUrl = "https://localhost:7243";

export const tokenManager = {
  getToken: () => localStorage.getItem("jwt_token"),

  setToken: (token, expiresIn = 60) => {
    localStorage.setItem("jwt_token", token);
    localStorage.setItem("token_expires", Date.now() + expiresIn * 60 * 1000);
  },

  removeToken: () => {
    localStorage.removeItem("jwt_token");
    localStorage.removeItem("token_expires");
    localStorage.removeItem("username");
    localStorage.removeItem("role");
    localStorage.removeItem("account_id");
    localStorage.removeItem("user_id");
    localStorage.removeItem("user_avatar");
  },

  // decoded token
  decodeToken: () => {
    const token = tokenManager.getToken();
    if (!token) return null;

    try {
      const payload = token.split(".")[1];
      const decoded = JSON.parse(decodeURIComponent(escape(atob(payload))));
      return decoded;
    } catch (error) {
      console.error("Failed to decode token:", error);
      return null;
    }
  },

  // lấy thông tin từ token
  getUserInfo: () => {
    const decoded = tokenManager.decodeToken();
    if (!decoded) return null;

    return {
      accountId: decoded.AccountId,
      userId:
        decoded[
          "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"
        ],
      fullName:
        decoded["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"],
      userAvatar: decoded["UserAvatar"],
      role: decoded[
        "http://schemas.microsoft.com/ws/2008/06/identity/claims/role"
      ],
      exp: decoded.exp,
    };
  },

  isTokenExpired: () => {
    const decoded = tokenManager.decodeToken();
    if (!decoded || !decoded.exp) {
      const expires = localStorage.getItem("token_expires");
      return !expires || Date.now() > parseInt(expires);
    }

    return Date.now() >= decoded.exp * 1000;
  },

  isTokenExpiringSoon: (minutesBefore = 5) => {
    const decoded = tokenManager.decodeToken();
    if (!decoded || !decoded.exp) {
      const expires = localStorage.getItem("token_expires");
      if (!expires) return true;
      return Date.now() > parseInt(expires) - minutesBefore * 60 * 1000;
    }

    return Date.now() >= decoded.exp * 1000 - minutesBefore * 60 * 1000;
  },

  isAuthenticated: () => {
    const token = tokenManager.getToken();
    return token && !tokenManager.isTokenExpired();
  },
  // lấy ra userid
  getCurrentUserId: () => {
    const userInfo = tokenManager.getUserInfo();
    return userInfo?.userId || null;
  },

  // lấy ra accoutid
  getCurrentAccountId: () => {
    const userInfo = tokenManager.getUserInfo();
    return userInfo?.accountId || null;
  },

  // lấy ra role
  getCurrentUserRole: () => {
    const userInfo = tokenManager.getUserInfo();
    return userInfo?.role || null;
  },

  // lấy ra name
  getCurrentUserName: () => {
    const userInfo = tokenManager.getUserInfo();
    return userInfo?.fullName || null;
  },

  // lấy ra avatarUrl
  getUserAvatarUrl: () => {
    const userInfo = tokenManager.getUserInfo();
    const avatar = userInfo?.userAvatar;

    if (!avatar || avatar === "Unknown" || avatar === "patient.png") {
      return "./assets/image/patient/patient.png";
    }

    return avatar;
  },
};

// Auto refresh token if expiring soon
const attemptTokenRefresh = async () => {
  try {
    const response = await fetch(
      `${backendBaseUrl}/api/Account/refresh-token`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${tokenManager.getToken()}`,
        },
      }
    );

    if (response.ok) {
      const data = await response.json();
      tokenManager.setToken(data.token, 60);
      console.log("Token refreshed successfully");
      return true;
    } else {
      throw new Error("Token refresh failed");
    }
  } catch (error) {
    console.error("Failed to refresh token:", error);
    tokenManager.removeToken();
    return false;
  }
};

// Enhanced API request with automatic token refresh
const apiRequest = async (url, options = {}) => {
  const token = tokenManager.getToken();

  if (!token) {
    window.location.href = "/login";
    throw new Error("No authentication token found");
  }

  if (tokenManager.isTokenExpired()) {
    const refreshed = await attemptTokenRefresh();
    if (!refreshed) {
      window.location.href = "/login";
      throw new Error("Token expired and refresh failed");
    }
  }

  if (tokenManager.isTokenExpiringSoon()) {
    attemptTokenRefresh().catch(console.error);
  }

  const isFormData = options.body instanceof FormData;

  const config = {
    ...options,
    headers: {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...options.headers,
    },
  };

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  try {
    const response = await fetch(url, config);

    if (response.status === 401) {
      const refreshed = await attemptTokenRefresh();
      if (refreshed) {
        config.headers.Authorization = `Bearer ${tokenManager.getToken()}`;
        return await fetch(url, config);
      } else {
        tokenManager.removeToken();
        window.location.href = "/login";
        throw new Error("Authentication failed");
      }
    }

    return response;
  } catch (error) {
    console.error("API request failed:", error);
    throw error;
  }
};

// api login
export const loginApi = async (email, password) => {
  const response = await fetch(`${backendBaseUrl}/api/Account/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      identifier: email,
      password_hash: password,
    }),
  });
  return response;
};

// api register
export const registerAPI = async (formData) => {
  const response = await fetch(`${backendBaseUrl}/api/Account/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      username: formData.username,
      password_hash: formData.password,
      email: formData.email,
      full_name: formData.fullName,
      gender: formData.gender,
      phone: formData.phone,
      birthdate: formData.birthdate,
      role: "Patient",
      address: formData.address,
    }),
  });
  return response;
};

export const refreshToken = async () => {
  return await apiRequest(`${backendBaseUrl}/api/Account/refresh-token`, {
    method: "POST",
  });
};

export const checkAuthStatus = () => {
  return tokenManager.isAuthenticated();
};

export { apiRequest };
