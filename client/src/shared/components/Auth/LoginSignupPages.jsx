import { useEffect, useState } from "react";
import {
  Box,
  Tab,
  TextField,
  Paper,
  useTheme,
  Avatar,
  Typography,
  InputAdornment,
  IconButton,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import { LoadingButton } from "@mui/lab";
import { TabContext, TabList, TabPanel } from "@mui/lab";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import { Link, useSearchParams } from "react-router-dom";
import { useAuthRedirect } from "../../hooks/useAuthRedirect";

const LoginSignupPages = () => {
  const [searchParams] = useSearchParams();
  const [value, setValue] = useState("1");
  const theme = useTheme();

  useEffect(() => {
    const option = searchParams.get("option");
    setValue(option === "signup" ? "2" : option === "reset" ? "3" : "1");
  }, [searchParams]);

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  return (
    <Box
      sx={{
        height: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: theme.palette.background.default,
      }}
    >
      <Paper
        elevation={3}
        sx={{
          width: 400,
          padding: theme.spacing(4),
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <Avatar sx={{ m: 1, bgcolor: theme.palette.secondary.main }}>
          <LockOutlinedIcon />
        </Avatar>
        <Typography component="h1" variant="h5" sx={{ mb: 3 }}>
          Welcome
        </Typography>
        <TabContext value={value}>
          <Box sx={{ width: "100%", mb: 3 }}>
            <TabList
              onChange={handleChange}
              aria-label="login signup tabs"
              variant="fullWidth"
            >
              <Tab label="Login" value="1" />
              <Tab label="Sign Up" value="2" />
            </TabList>
          </Box>
          <TabPanel value="1" sx={{ width: "100%", p: 0 }}>
            <LoginForm onResetPassword={() => setValue("3")} />
          </TabPanel>
          <TabPanel value="2" sx={{ width: "100%", p: 0 }}>
            <SignupForm />
          </TabPanel>
          <TabPanel value="3" sx={{ width: "100%", p: 0 }}>
            <ResetPasswordForm onBack={() => setValue("1")} />
          </TabPanel>
        </TabContext>
      </Paper>
    </Box>
  );
};

const LoginForm = ({ onResetPassword }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const { loginWithRedirect } = useAuthRedirect();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    try {
      const success = await loginWithRedirect(username, password);
      if (success) {
      } else {
        setError("Login failed. Please check your credentials and try again.");
      }
    } catch (err) {
      setError(
        err.message || "An unexpected error occurred. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ width: "100%" }}>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      <TextField
        margin="normal"
        required
        fullWidth
        id="username"
        label="Username"
        name="username"
        autoComplete="username"
        autoFocus
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />
      <TextField
        margin="normal"
        required
        fullWidth
        name="password"
        label="Password"
        type={showPassword ? "text" : "password"}
        id="password"
        autoComplete="current-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <IconButton
                aria-label="toggle password visibility"
                onClick={() => setShowPassword(!showPassword)}
                edge="end"
              >
                {showPassword ? <VisibilityOff /> : <Visibility />}
              </IconButton>
            </InputAdornment>
          ),
        }}
      />
      <LoadingButton
        type="submit"
        fullWidth
        variant="contained"
        sx={{ mt: 3, mb: 2, py: 1.5 }}
        loading={isLoading}
      >
        Sign In
      </LoadingButton>
      <Box sx={{ textAlign: "center" }}>
        <Link component="button" variant="body2" onClick={onResetPassword}>
          Forgot password?
        </Link>
      </Box>
    </form>
  );
};

const SignupForm = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [securityQuestion, setSecurityQuestion] = useState("");
  const [securityAnswer, setSecurityAnswer] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const { signupWithRedirect } = useAuthRedirect();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    try {
      const success = await signupWithRedirect(
        username,
        password,
        securityQuestion,
        securityAnswer
      );
      if (success) {
      } else {
        setError(
          "Registration failed. Please try a different username or password."
        );
      }
    } catch (err) {
      setError(
        err.message || "An unexpected error occurred. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ width: "100%" }}>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      <TextField
        margin="normal"
        required
        fullWidth
        id="username"
        label="Username"
        name="username"
        autoComplete="username"
        autoFocus
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />
      <TextField
        margin="normal"
        required
        fullWidth
        name="password"
        label="Password"
        type={showPassword ? "text" : "password"}
        id="password"
        autoComplete="new-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <IconButton
                aria-label="toggle password visibility"
                onClick={() => setShowPassword(!showPassword)}
                edge="end"
              >
                {showPassword ? <VisibilityOff /> : <Visibility />}
              </IconButton>
            </InputAdornment>
          ),
        }}
      />
      <FormControl fullWidth margin="normal" required>
        <InputLabel id="security-question-label">Security Question</InputLabel>
        <Select
          labelId="security-question-label"
          id="security-question"
          value={securityQuestion}
          label="Security Question"
          onChange={(e) => setSecurityQuestion(e.target.value)}
        >
          <MenuItem value="What was your first pet's name?">
            What was your first pet's name?
          </MenuItem>
          <MenuItem value="In what city were you born?">
            In what city were you born?
          </MenuItem>
          <MenuItem value="What is your mother's maiden name?">
            What is your mother's maiden name?
          </MenuItem>
        </Select>
      </FormControl>
      <TextField
        margin="normal"
        required
        fullWidth
        name="security-answer"
        label="Security Answer"
        id="security-answer"
        value={securityAnswer}
        onChange={(e) => setSecurityAnswer(e.target.value)}
      />
      <LoadingButton
        type="submit"
        fullWidth
        variant="contained"
        sx={{ mt: 3, mb: 2, py: 1.5 }}
        loading={isLoading}
      >
        Sign Up
      </LoadingButton>
    </form>
  );
};

const ResetPasswordForm = ({ onBack }) => {
  const [username, setUsername] = useState("");
  const [securityQuestion, setSecurityQuestion] = useState("");
  const [securityAnswer, setSecurityAnswer] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const { resetPasswordWithRedirect } = useAuthRedirect();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    try {
      const success = await resetPasswordWithRedirect(
        username,
        securityQuestion,
        securityAnswer,
        newPassword
      );
      if (success) {
        onBack(); // Go back to login form after successful reset
      } else {
        setError(
          "Password reset failed. Please check your information and try again."
        );
      }
    } catch (err) {
      setError(
        err.message || "An unexpected error occurred. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ width: "100%" }}>
      <Typography variant="h6" sx={{ mb: 2 }}>
        Reset Password
      </Typography>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      <TextField
        margin="normal"
        required
        fullWidth
        id="username"
        label="Username"
        name="username"
        autoComplete="username"
        autoFocus
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />
      <FormControl fullWidth margin="normal" required>
        <InputLabel id="security-question-label">Security Question</InputLabel>
        <Select
          labelId="security-question-label"
          id="security-question"
          value={securityQuestion}
          label="Security Question"
          onChange={(e) => setSecurityQuestion(e.target.value)}
        >
          <MenuItem value="What was your first pet's name?">
            What was your first pet's name?
          </MenuItem>
          <MenuItem value="In what city were you born?">
            In what city were you born?
          </MenuItem>
          <MenuItem value="What is your mother's maiden name?">
            What is your mother's maiden name?
          </MenuItem>
        </Select>
      </FormControl>
      <TextField
        margin="normal"
        required
        fullWidth
        name="security-answer"
        label="Security Answer"
        id="security-answer"
        value={securityAnswer}
        onChange={(e) => setSecurityAnswer(e.target.value)}
      />
      <TextField
        margin="normal"
        required
        fullWidth
        name="new-password"
        label="New Password"
        type={showPassword ? "text" : "password"}
        id="new-password"
        autoComplete="new-password"
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <IconButton
                aria-label="toggle password visibility"
                onClick={() => setShowPassword(!showPassword)}
                edge="end"
              >
                {showPassword ? <VisibilityOff /> : <Visibility />}
              </IconButton>
            </InputAdornment>
          ),
        }}
      />
      <LoadingButton
        type="submit"
        fullWidth
        variant="contained"
        sx={{ mt: 3, mb: 2, py: 1.5 }}
        loading={isLoading}
      >
        Reset Password
      </LoadingButton>
      <Box sx={{ textAlign: "center" }}>
        <Link component="button" variant="body2" onClick={onBack}>
          Back to Login
        </Link>
      </Box>
    </form>
  );
};

export default LoginSignupPages;
