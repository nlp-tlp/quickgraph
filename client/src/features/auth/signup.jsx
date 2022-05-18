import { useEffect } from "react";
import "./Auth.css";
import history from "../utils/history";
import { Formik } from "formik";
import * as yup from "yup";
import { Card, Form, Button, Col } from "react-bootstrap";
import SignUpImage from "../../media/signup.jpeg";
import { useDispatch, useSelector } from "react-redux";
import {
  selectSignupError,
  selectSignupStatus,
  signup,
  selectIsAuthenticated,
} from "./userSlice";

const schema = yup.object().shape({
  username: yup
    .string()
    .required("Username is required")
    .min(5, "Username must be at least 3 characters long"),
  password: yup
    .string()
    .required("Password is required")
    .min(5, "Password must be at least 5 characters long"),
  email: yup
    .string()
    .email("Must be a valid email")
    .max(255)
    .required("Email is required"),
});

export const SignUp = () => {
  const dispatch = useDispatch();
  const signupStatus = useSelector(selectSignupStatus);
  const signupError = useSelector(selectSignupError);
  const isAuthenticated = useSelector(selectIsAuthenticated);

  useEffect(() => {
    if (signupStatus === "succeeded" && isAuthenticated) {
      history.push("/feed");
    }
  }, [signupStatus, signupError]);

  const handleSubmit = (values) => {
    const { username, password, email } = values;
    dispatch(signup({ username, password, email }));
  };

  return (
    <Card id="signup-card">
      <Card.Img src={SignUpImage} />
      <Card.Body>
        <Card.Title>Welcome! Sign up to begin</Card.Title>
        <Formik
          validationSchema={schema}
          onSubmit={(values) => handleSubmit(values)}
          initialValues={{
            username: "",
            email: "",
            password: "",
          }}
        >
          {({
            handleSubmit,
            handleChange,
            handleBlur,
            values,
            touched,
            isValid,
            errors,
          }) => (
            <Form noValidate onSubmit={handleSubmit}>
              <Form.Row>
                <Form.Group as={Col} md="12" controlId="validationFormik01">
                  <Form.Label>Username</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Enter Username"
                    name="username"
                    value={values.username}
                    onChange={handleChange}
                    autoComplete="off"
                    isValid={touched.username && !errors.username}
                    isInvalid={touched.username && errors.username}
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.username}
                  </Form.Control.Feedback>
                </Form.Group>
              </Form.Row>

              <Form.Row>
                <Form.Group as={Col} md="12" controlId="validationFormik03">
                  <Form.Label>Password</Form.Label>
                  <Form.Control
                    type="password"
                    placeholder="Enter Password"
                    name="password"
                    value={values.password}
                    onChange={handleChange}
                    autoComplete="off"
                    isValid={touched.password && !errors.password}
                    isInvalid={touched.password && errors.password}
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.password}
                  </Form.Control.Feedback>
                </Form.Group>
              </Form.Row>
              <Form.Row>
                <Form.Group as={Col} md="12" controlId="validationFormik02">
                  <Form.Label>Email</Form.Label>
                  <Form.Control
                    type="email"
                    placeholder="Email Address"
                    name="email"
                    value={values.email}
                    onChange={handleChange}
                    autoComplete="off"
                    isValid={touched.email && !errors.email}
                    isInvalid={touched.email && errors.email}
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.email}
                  </Form.Control.Feedback>
                </Form.Group>
              </Form.Row>
              <Button type="submit" variant="dark">
                Sign Up
              </Button>
            </Form>
          )}
        </Formik>
      </Card.Body>
      <a href="/" className="text-muted" id="return-button">
        Return to landing page
      </a>
    </Card>
  );
};
