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
      }}
    >
      {tokens &&
        tokens.map((token, tokenIndex) => {
          const tokenProps = {
            text,
            token,
            tokenIndex,
          };
          return <Token {...tokenProps} />;
        })}
    </div>
  );
};
