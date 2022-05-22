import React, { useState, useEffect } from "react";
import axios from "../utils/api-interceptor";
import "./Modals.css";
import { Button, Form, Col } from "react-bootstrap";
import { useDispatch } from "react-redux";
import { inviteAnnotators, setActiveModal } from "../project/projectSlice";

export const AnnotatorInvite = ({ projectId, projectAnnotators }) => {
  const dispatch = useDispatch();
  const [inviteList, setInviteList] = useState([]);
  const [users, setUsers] = useState();
  const [usersLoaded, setUsersLoaded] = useState(false);
  const activeUsers =
    projectAnnotators && projectAnnotators.map((a) => a.user._id);

  const [distributionMethod, setDistributionMethod] = useState();

  useEffect(() => {
    const fetchUsers = async () => {
      if (!usersLoaded) {
        const response = await axios.get("/api/user/management/users");
        if (response.status === 200) {
          // console.log(response.data);
          setUsers(response.data);
          setUsersLoaded(true);
        }
      }
    };
    fetchUsers();
  }, [usersLoaded]);

  const handleAddAnnotators = async () => {
    // console.log("adding users", inviteList);
    dispatch(
      inviteAnnotators({
        projectId: projectId,
        userIds: inviteList,
        docDistributionMethod: distributionMethod,
      })
    );
    dispatch(setActiveModal(null));
  };

  return (
    <div>
      <h5>Annotators</h5>
      <p>Please select annotators to invite to this project</p>
      <Form.Group as={Col} controlId="my_multiselect_field">
        <Form.Control
          as="select"
          multiple
          value={inviteList}
          onChange={(e) =>
            setInviteList(
              [].slice.call(e.target.selectedOptions).map((item) => item.value)
            )
          }
        >
          {users?.map((user) => (
            <option value={user._id} disabled={activeUsers.includes(user._id)}>
              {user.username}
            </option>
          ))}
        </Form.Control>
      </Form.Group>
      <h5>Document Assignment</h5>
      <p>Specify documents distribution method for annotators</p>
      <Form.Group as={Col}>
        <Form.Control
          as="select"
          onChange={(e) => setDistributionMethod(e.target.value)}
        >
          <option>Choose distribution method</option>
          <option value="all">All</option>
          <option value="automatic" disabled>
            Automatic
          </option>
          <option value="manual" disabled>
            Manual
          </option>
        </Form.Control>
      </Form.Group>

      <div style={{ display: "flex", justifyContent: "center" }}>
        <Button
          variant="dark"
          size="sm"
          onClick={handleAddAnnotators}
          disabled={inviteList.length === 0 || distributionMethod === ""}
        >
          Invite
        </Button>
      </div>
    </div>
  );
};
