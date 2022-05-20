import "./Text.css";
import { Token } from "../token/token";
import { selectTexts } from "../../../app/dataSlice";
import { useSelector } from "react-redux";

export const Text = ({ textId, textIndex }) => {
  const texts = useSelector(selectTexts);
  return (
    <div
      key={textIndex}
      className="text"
      style={{
        display: "flex",
        flexDirection: "row",
        flexWrap: "wrap",
      }}
    >
      {texts &&
        Object.keys(texts[textId].tokens).map((tokenId, tokenIndex) => {
          const tokenProps = {
            tokenId,
            textId,
            tokenIndex,
          };
          return <Token {...tokenProps} />;
        })}
    </div>
  );
};
