import React, { useEffect, useState } from "react";
import "./Profile.css";
import {
  Button,
  Card,
  Col,
  Container,
  Nav,
  Spinner,
  OverlayTrigger,
  Popover,
  Row,
  Tooltip,
  Form,
  Alert,
} from "react-bootstrap";
import { BiNetworkChart } from "react-icons/bi";
import { FaDownload, FaUsers } from "react-icons/fa";
import { GiProgression } from "react-icons/gi";
import {
  IoBarChart,
  IoCheckmarkCircle,
  IoCheckmarkCircleSharp,
  IoCloseCircle,
  IoGitCommit,
  IoHourglass,
  IoLayers,
  IoLink,
  IoPulse,
  IoSettings,
  IoShareSocial,
  IoBrush,
} from "react-icons/io5";
import { Formik } from "formik";
import * as yup from "yup";
import {
  selectUsername,
  selectColour,
  updateAvatarColour,
  updateProfile,
} from "../auth/userSlice";
import { useDispatch, useSelector } from "react-redux";
import axios from "../utils/api-interceptor";

const schema = yup.object().shape({
  username: yup
    .string()
    .min(3)
    .required("Username is required")
    .test("Unique username", "Username already in use", async (username) => {
      const response = await axios.post("/api/user/validation/exists", {
        field: "username",
        value: username,
      });
      if (response.status === 200) {
        return response.data.valid;
      }
    }),
  email: yup
    .string()
    .email("Must be a valid email")
    .max(255)
    .required("Email is required")
    .test("Unique email", "Email already in use", async (email) => {
      const response = await axios.post("/api/user/validation/exists", {
        field: "email",
        value: email,
      });
      if (response.status === 200) {
        return response.data.valid;
      }
    }),
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
          console.log("profile data", response.data);
          setProfileData(response.data);
          setProfileLoaded(true);
        }
      }
    };
    fetchProfileData();
  }, [profileLoaded]);

  const handleSave = (values) => {
    dispatch(
      updateProfile({
        username: values.username,
        email: values.email,
        publicBool: values.public,
      })
    );
    setProfileLoaded(false);
  };

  return (
    <Container fluid style={{ width: "75vw", maxWidth: '800px', height: "auto" }}>
      <Row style={{ marginTop: "2rem" }}>
        <Col>
          {profileLoaded ? (
            <Card>
              <Card.Title>
                <div
                  style={{
                    display: "flex",
                    padding: "1rem 0rem 0rem 1rem",
                    alignItems: "center",
                  }}
                >
                  <UserAvatar />
                  <span style={{ marginLeft: "0.5rem" }}>
                    {profileData.username}
                  </span>
                </div>
              </Card.Title>
              <Card.Body>
                <Formik
                  validationSchema={schema}
                  onSubmit={(values) => handleSave(values)}
                  initialValues={{
                    username: profileData.username,
                    email: profileData.email,
                    public: profileData.public,
                    oldPassword: "",
                    newPassword: "",
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
                        <Form.Group
                          as={Col}
                          md="12"
                          controlId="validationFormik01"
                        >
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
                        <Form.Group
                          as={Col}
                          md="12"
                          controlId="validationFormik02"
                        >
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
                      <Form.Row>
                        <Form.Group
                          as={Col}
                          md="12"
                          controlId="validationFormik02"
                        >
                          <Form.Label>Old Password</Form.Label>
                          <Form.Control
                            disabled
                            type="password"
                            placeholder="Enter old password"
                            name="old password"
                            value={values.oldPassword}
                            onChange={handleChange}
                            autoComplete="off"
                            // isValid={touched.oldPassword && !errors.oldPassword}
                            // isInvalid={
                            //   touched.oldPassword && errors.oldPassword
                            // }
                          />
                          {/* <Form.Control.Feedback type="invalid">
                            {errors.oldPassword}
                          </Form.Control.Feedback> */}
                        </Form.Group>
                      </Form.Row>
                      <Form.Row>
                        <Form.Group
                          as={Col}
                          md="12"
                          controlId="validationFormik02"
                        >
                          <Form.Label>New Password</Form.Label>
                          <Form.Control
                            disabled
                            type="password"
                            placeholder="Enter new password"
                            name="new password"
                            value={values.newPassword}
                            onChange={handleChange}
                            autoComplete="off"
                            // isValid={touched.newPassword && !errors.newPassword}
                            // isInvalid={
                            //   touched.newPassword && errors.newPassword
                            // }
                          />
                          {/* <Form.Control.Feedback type="invalid">
                            {errors.newPassword}
                          </Form.Control.Feedback> */}
                        </Form.Group>
                      </Form.Row>
                      <Form.Row>
                        <Form.Group className="mb-3">
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
                        </Form.Group>
                      </Form.Row>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                        }}
                      >
                        <p style={{ color: "grey", fontSize: "0.75rem" }}>
                          Last updated:{" "}
                          {new Date(profileData.updatedAt).toDateString()}
                        </p>
                        <Button
                          type="submit"
                          variant="success"
                          disabled={!isValid}
                        >
                          Save Changes
                        </Button>
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
  const muiColorPalette500 = [
    "#E91E63",
    "#9C27B0",
    "#FFC107",
    "#03A9F4",
    "#673AB7",
    "#F44336",
    "#795548",
    "#3F51B5",
    "#00BCD4",
    "#4CAF50",
    "#FFEB3B",
    "#FF9800",
    "#009688",
    "#2196F3",
    "#8BC34A",
    "#CDDC39",
    "#FF5722",
  ];
  const username = useSelector(selectUsername);
  const avatarColour = useSelector(selectColour);
  const dispatch = useDispatch();
  const [showPicker, setShowPicker] = useState(false);

  const [selectedColour, setSelectedColour] = useState("");

  const handleClick = (colour) => {
    setSelectedColour((prevState) => (prevState === colour ? "" : colour));
    console.log(colour);
  };

  return (
    <div style={{ display: "flex" }}>
      <div id="avatar" style={{ backgroundColor: avatarColour }}>
        {username[0]}
      </div>
      <OverlayTrigger
        trigger="click"
        placement="bottom"
        rootClose
        show={showPicker}
        overlay={
          <Popover>
            <Popover.Title>Avatar Colour</Popover.Title>
            <Popover.Content id="avatar-colour-selector">
              {muiColorPalette500.map((colour) => (
                <div
                  id="avatar-example"
                  active={
                    selectedColour === ""
                      ? "true"
                      : colour === selectedColour
                      ? "true"
                      : "false"
                  }
                  style={{
                    backgroundColor: colour,
                  }}
                  onClick={() => handleClick(colour)}
                >
                  {username[0]}
                </div>
              ))}
            </Popover.Content>
            <Popover.Content
              style={{ display: "flex", justifyContent: "center" }}
            >
              <Button
                size="sm"
                variant={selectedColour === "" ? "secondary" : "success"}
                disabled={selectedColour === ""}
                onClick={() => {
                  dispatch(updateAvatarColour({ colour: selectedColour }));
                  setShowPicker(false);
                }}
              >
                Change Colour
              </Button>
            </Popover.Content>
          </Popover>
        }
      >
        <IoBrush
          id="avatar-colour-picker-icon"
          onClick={() => setShowPicker(!showPicker)}
        />
      </OverlayTrigger>
    </div>
  );
};
