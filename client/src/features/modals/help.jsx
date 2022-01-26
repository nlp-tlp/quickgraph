import "./Modals.css";
import QRG from "../../media/QRG.png";

export const Help = () => {
  return (
    <div className="help">
      <img id="qrg-img" src={QRG} alt="LexiClean Quick Reference Guide" />
      <span style={{ fontSize: "12px" }}>
        Please contact{" "}
        <a
          href="mailto:tyler.bikaun@research.uwa.edu.au?subject=QuickGraph Help"
          target="_blank"
          rel="noreferrer"
        >
          tyler.bikaun@research.uwa.edu.au
        </a>{" "}
        if any information is required in the meantime.
      </span>
      {/* 
      <p id="description-title">Guide</p>
      <p>
        1. <strong>Project save button</strong>: Changes colour when changes are
        detected.
      </p>
      <p>
        2. <strong>Annotation metrics</strong>: Indicates the current state of
        annotation.
      </p>
      <p>
        3. <strong>Project menu</strong>: Context menu for project that includes
        i. token colour legend, ii. result download, iii. schema modification
        and activations, and iv. Annotation window settings.
      </p>
      <p>
        4. <strong>Tokenization mode button</strong>: Changes text into
        tokenization mode.
      </p>
      <p>
        5. <strong>Text tokenization mode</strong>: Allows tokens to be modified
        by clicking adjoining tokens and applying the tokenization.
      </p>
      <p>
        6. <strong>Text normalisation mode</strong>: Allows tokens to be
        replaced in situ and meta tags to be assigned by right clicking on
        tokens.
      </p> */}
    </div>
  );
};
