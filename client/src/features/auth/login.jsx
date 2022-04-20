import "./Auth.css";
import { useEffect } from "react";
import history from "../utils/history";
import { login, selectLoginStatus, selectIsAuthenticated } from "./userSlice";
import { useDispatch, useSelector } from "react-redux";
import { Card, Form, Button, Col } from "react-bootstrap";
import { Formik } from "formik";
import * as yup from "yup";
import LoginImage from "../../media/login.jpeg";

const schema = yup.object().shape({
  username: yup.string().required("Please enter your username"),
  password: yup.string().required("Please enter your password"),
});

export const Login = () => {
  const dispatch = useDispatch();
  const loginStatus = useSelector(selectLoginStatus);
  const isAuthenticated = useSelector(selectIsAuthenticated);

  useEffect(() => {
    if (loginStatus === "succeeded" && isAuthenticated) {
      history.push("/feed");
    }
  }, [loginStatus, isAuthenticated]);

  const handleSubmit = (values) => {
    const { username, password } = values;
    dispatch(login({ username, password }));
  };

  return (
    <Card id="login-card">
      <Card.Img src={LoginImage} />
      <Card.Body>
        <Card.Title>Login to QuickGraph</Card.Title>
        <Formik
          validationSchema={schema}
          onSubmit={(values) => handleSubmit(values)}
          initialValues={{
            username: "",
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
              <Button variant="dark" type="submit">
                Login
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
