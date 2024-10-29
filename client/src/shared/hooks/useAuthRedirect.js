import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export const useAuthRedirect = () => {
  const navigate = useNavigate();
  const auth = useAuth();

  const loginWithRedirect = async (username, password, redirectPath = "/") => {
    const success = await auth.login(username, password);
    if (success) {
      navigate(redirectPath);
    }
    return success;
  };

  const logoutWithRedirect = () => {
    auth.logout();
    navigate("/", { replace: true });
  };

  const signupWithRedirect = async (
    username,
    password,
    securityQuestion,
    securityAnswer
  ) => {
    const success = await auth.register(
      username,
      password,
      securityQuestion,
      securityAnswer
    );
    if (success) {
      navigate("/");
    }
    return success;
  };

  const resetPasswordWithRedirect = async (
    username,
    securityQuestion,
    securityAnswer,
    newPassword,
    redirectPath = "/"
  ) => {
    const success = await auth.resetPassword(
      username,
      securityQuestion,
      securityAnswer,
      newPassword
    );
    if (success) {
      navigate(redirectPath);
    }
    return success;
  };

  return {
    ...auth,
    loginWithRedirect,
    logoutWithRedirect,
    signupWithRedirect,
    resetPasswordWithRedirect,
  };
};
