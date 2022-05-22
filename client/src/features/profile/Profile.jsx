import { Formik } from "formik";
import { useEffect, useState } from "react";
import {
  Button,
  Card,
  Col,
  Container,
  Form,
  Row,
  Spinner,
} from "react-bootstrap";
import { useDispatch, useSelector } from "react-redux";
import * as yup from "yup";
import { selectColour, selectUsername, updateProfile } from "../auth/userSlice";
import axios from "../utils/api-interceptor";
import "./Profile.css";
import { grey } from "@mui/material/colors";
import { getFontColour } from "../project/utils";

// TODO: Fix test firing when just avatar colour is changed - this blocks update.
const schema = yup.object().shape({
  username: yup.string().min(3).required("Username is required"),
  // .test("Unique username", "Username already in use", async (username) => {
  //   const response = await axios.post("/api/user/validation/exists", {
  //     field: "username",
  //     value: username,
  //   });
  //   if (response.status === 200) {
  //     return response.data.valid;
  //   }
  // })
  email: yup
    .string()
    .email("Must be a valid email")
    .max(255)
    .required("Email is required"),
  // .test("Unique email", "Email already in use", async (email) => {
  //   const response = await axios.post("/api/user/validation/exists", {
  //     field: "email",
  //     value: email,
  //   });
  //   if (response.status === 200) {
  //     return response.data.valid;
  //   }
  // })
  public: yup.boolean(),
});

export const Profile = () => {
  const dispatch = useDispatch();
  const [profileData, setProfileData] = useState();
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [alertText, setAlertText] = useState();

  useEffect(() => {
    const fetchProfileData = async () => {
      if (!profileLoaded) {
        const response = await axios.get("/api/user/profile");
        if (response.status === 200) {
          setProfileData(response.data);
          setProfileLoaded(true);
        }
      }
    };
    fetchProfileData();
  }, [profileLoaded]);

  const handleSave = (values) => {
    // console.log(values);

    dispatch(
      updateProfile({
        username: values.username,
        email: values.email,
        publicBool: values.public,
        colour: values.colour,
      })
    );
    setProfileLoaded(false);
  };

  return (
    <Container
      fluid
      style={{
        maxWidth: "400px",
        height: "auto",
      }}
    >
      <Row style={{ marginTop: "2rem" }}>
        <Col>
          {profileLoaded ? (
            <Card>
              <Card.Title>
                <UserAvatar profileData={profileData} />
              </Card.Title>
              <Card.Body
                style={{
                  textAlign: "left",
                }}
              >
                <Formik
                  validationSchema={schema}
                  onSubmit={(values) => handleSave(values)}
                  initialValues={{
                    username: profileData.username,
                    email: profileData.email,
                    public: profileData.public,
                    oldPassword: "",
                    newPassword: "",
                    colour: profileData.colour,
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
                      <Form>
                        <Form.Group as={Row} controlId="validationFormik01">
                          <Form.Label column sm={4}>
                            Username
                          </Form.Label>
                          <Col sm={8}>
                            <Form.Control
                              type="text"
                              placeholder="Enter Username"
                              name="username"
                              value={values.username}
                              onChange={handleChange}
                              autoComplete="off"
                              isValid={touched.username && !errors.username}
                              isInvalid={touched.username && errors.username}
                              disabled
                            />
                            <Form.Control.Feedback type="invalid">
                              {errors.username}
                            </Form.Control.Feedback>
                          </Col>
                        </Form.Group>
                      </Form>
                      <Form>
                        <Form.Group as={Row} controlId="validationFormik02">
                          <Form.Label column sm={4}>
                            Email
                          </Form.Label>
                          <Col sm={8}>
                            <Form.Control
                              type="email"
                              placeholder="Email Address"
                              name="email"
                              value={values.email}
                              onChange={handleChange}
                              autoComplete="off"
                              isValid={touched.email && !errors.email}
                              isInvalid={touched.email && errors.email}
                              disabled
                            />
                            <Form.Control.Feedback type="invalid">
                              {errors.email}
                            </Form.Control.Feedback>
                          </Col>
                        </Form.Group>
                      </Form>
                      <Form>
                        <Form.Group as={Row}>
                          <Form.Label column sm={9}>
                            Avatar Colour
                          </Form.Label>
                          <Col sm={3}>
                            <Form.Control
                              type="color"
                              name="colour"
                              id="userAvatarColour"
                              value={values.colour}
                              onChange={handleChange}
                            />
                          </Col>
                        </Form.Group>
                      </Form>
                      <Form>
                        <Form.Group as={Row}>
                          <Col>
                            <Form.Check
                              required
                              name="public"
                              label="Public Profile"
                              onChange={handleChange}
                              isInvalid={!!errors.public}
                              feedback={errors.public}
                              feedbackType="invalid"
                              id="validationFormik0"
                              checked={values.public}
                            />
                            <Form.Text className="text-muted">
                              Settings your profile as private will make
                              invitations require your email
                            </Form.Text>
                          </Col>
                        </Form.Group>
                      </Form>
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                        }}
                      >
                        <Button
                          type="submit"
                          variant="success"
                          disabled={!isValid}
                        >
                          Save Changes
                        </Button>
                        <span
                          style={{
                            margin: "1rem 0rem 0rem 0rem",
                            color: grey[500],
                            fontSize: "0.75rem",
                          }}
                        >
                          Last updated:{" "}
                          {new Date(profileData.updatedAt).toDateString()}
                        </span>
                      </div>
                    </Form>
                  )}
                </Formik>
              </Card.Body>
            </Card>
          ) : (
            <div
              style={{
                textAlign: "center",
              }}
            >
              <Spinner animation="border" />
            </div>
          )}
        </Col>
      </Row>
    </Container>
  );
};

const UserAvatar = () => {
  const username = useSelector(selectUsername);
  const avatarColour = useSelector(selectColour);
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        padding: "1rem 0rem 0rem 0rem",
      }}
    >
      <div
        id="avatar"
        style={{
          backgroundColor: avatarColour,
          color: getFontColour(avatarColour),
        }}
      >
        {username[0]}
      </div>
    </div>
  );
};
