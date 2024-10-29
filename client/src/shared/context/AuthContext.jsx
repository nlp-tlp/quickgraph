import { createContext, useContext, useEffect, useState } from "react";
import axiosInstance from "../utils/api";
import { jwtDecode } from "jwt-decode";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const checkTokenExpiration = (token) => {
    try {
      const decodedToken = jwtDecode(token);
      const currentTime = Date.now() / 1000; // Convert to seconds
      return decodedToken.exp > currentTime;
    } catch (error) {
      console.error("Error decoding token:", error);
      return false;
    }
  };

  const refreshToken = async () => {
    try {
      const response = await axiosInstance.post(
        "/users/token",
        {},
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );
      const { access_token } = response.data;
      if (checkTokenExpiration(access_token)) {
        localStorage.setItem("token", access_token);
        return access_token;
      }
    } catch (error) {
      console.error("Error refreshing token:", error);
      logout();
    }
    return null;
  };

  const getAccessToken = async () => {
    let token = localStorage.getItem("token");
    if (!token) {
      throw new Error("No token found");
    }
    if (!checkTokenExpiration(token)) {
      token = await refreshToken();
      if (!token) {
        throw new Error("Unable to refresh token");
      }
    }
    return token;
  };

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const token = await getAccessToken();
        if (token) {
          setIsAuthenticated(true);
          const decodedToken = jwtDecode(token);
          setUser({ username: decodedToken.sub });
        }
      } catch (error) {
        console.error("Error initializing auth:", error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (username, password) => {
    setIsLoading(true);
    try {
      const response = await axiosInstance({
        url: "/users/token",
        method: "POST",
        data: {
          username,
          password,
        },
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });
      const { access_token } = response.data;
      if (checkTokenExpiration(access_token)) {
        localStorage.setItem("token", access_token);
        setUser({ username });
        setIsAuthenticated(true);
        return true;
      } else {
        console.error("Received expired token");
        return false;
      }
    } catch (error) {
      console.error("Login failed:", error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
    setIsAuthenticated(false);
  };

  const register = async (
    username,
    password,
    securityQuestion,
    securityAnswer
  ) => {
    setIsLoading(true);
    try {
      // Register the user
      await axiosInstance({
        url: "/users/register",
        method: "POST",
        data: {
          username,
          password,
          security_question: securityQuestion,
          security_answer: securityAnswer,
        },
      });

      // If registration is successful, immediately log the user in
      const loginResponse = await axiosInstance({
        url: "/users/token",
        method: "POST",
        data: {
          username,
          password,
        },
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });

      const { access_token } = loginResponse.data;
      if (checkTokenExpiration(access_token)) {
        localStorage.setItem("token", access_token);
        setUser({ username });
        setIsAuthenticated(true);
        return true;
      } else {
        console.error("Received expired token after registration");
        return false;
      }
    } catch (error) {
      console.error("Registration failed:", error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const resetPassword = async (
    username,
    securityQuestion,
    securityAnswer,
    newPassword
  ) => {
    setIsLoading(true);
    try {
      const resetResponse = await axiosInstance.post("/users/reset-password", {
        username,
        security_question: securityQuestion,
        security_answer: securityAnswer,
        new_password: newPassword,
      });

      if (resetResponse.status === 200) {
        // Clear any existing tokens
        localStorage.removeItem("token");
        setUser(null);
        setIsAuthenticated(false);

        // If password reset is successful, log the user in with the new password
        const loginSuccess = await login(username, newPassword);
        if (loginSuccess) {
          return true;
        } else {
          console.error("Failed to log in after password reset");
          return false;
        }
      } else {
        console.error("Password reset failed");
        return false;
      }
    } catch (error) {
      console.error("Password reset process failed:", error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading,
        login,
        logout,
        register,
        resetPassword,
        getAccessToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
