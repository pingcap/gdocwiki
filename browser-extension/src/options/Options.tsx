import AuthenticateOptions from "./Options.Authenticate";
import { H2 } from "./Heading";
import styles from "./Options.module.scss";

function Options() {
  return (
    <div className={styles.body}>
      <H2>GdocWiki Integration Options</H2>
      <AuthenticateOptions />
      <H2>About</H2>
      <p>GdocWiki is a wiki based on Google Doc / Drive.</p>
      <p>
        GitHub:{" "}
        <a
          href="https://github.com/pingcap/gdocwiki"
          target="_blank"
          rel="noreferrer"
        >
          pingcap/gdocwiki
        </a>
      </p>
    </div>
  );
}

export default Options;
