import { useSelector } from "react-redux";
import { selectUsername, selectColour } from "../auth/userSlice";

export const UserAvatar = () => {
  const username = useSelector(selectUsername);
  const avatarColour = useSelector(selectColour);
  return (
    <div
      id="avatar"
      style={{
        backgroundColor: avatarColour,
        borderRadius: "50%",
        height: "40px",
        width: "40px",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        textTransform: "uppercase",
        fontSize: "22px",
        fontWeight: "bold",
      }}
    >
      {username ? username[0] : "?"}
    </div>
  );
};
