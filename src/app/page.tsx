import styles from "./page.module.css";
import { MainContainer } from "../containers";

export default function Home() {
  return (
    <div className={styles.fullPage}>
      <MainContainer className={styles.fullPageViewer} />
    </div>
  );
}
