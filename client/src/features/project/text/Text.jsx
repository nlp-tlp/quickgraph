import "./Text.css";
import { Token } from "../token/token";

export const Text = ({ text, textIndex, tokens }) => {
  return (
    <div
      key={textIndex}
      className="text-container"
      style={{
        display: "flex",
        flexDirection: "row",
        flexWrap: "wrap",
        // padding: "0rem 1rem 0.5rem 1rem",
      }}
    >
      {tokens &&
        tokens
          .filter((t) => t.text_id === text._id)
          .map((token, tokenIndex) => {
            const tokenProps = {
              text,
              textIndex,
              token,
              tokenIndex,
            };
            return <Token {...tokenProps} />;
          })}
    </div>
  );
};
