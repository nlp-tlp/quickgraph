import { Navbar } from "react-bootstrap";
import "./Footer.css";

export const Footer = () => {
  return (
    <Navbar fixed="bottom" className="footer">
      <p id="copyright">
        ©{" "}
        <a
          href="https://nlp-tlp.org/"
          target="_blank"
          rel="noreferrer"
          alt="nlp tlp group website"
        >
          UWA NLP-TLP Group
        </a>{" "}
        2022.
      </p>
      <p id="author">
        Developed by Tyler Bikaun (
        <a
          href="https://github.com/4theKnowledge"
          target="_blank"
          rel="noreferrer"
          alt="github repository"
        >
          4theKnowledge
        </a>
        )
      </p>
    </Navbar>
  );
};
