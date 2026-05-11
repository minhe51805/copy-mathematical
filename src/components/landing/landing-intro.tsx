"use client";

import { useEffect, useState } from "react";
import styles from "./landing-intro.module.css";

export function LandingIntro() {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => setIsVisible(false), 2400);
    return () => window.clearTimeout(timer);
  }, []);

  if (!isVisible) {
    return null;
  }

  return (
    <div className={styles.overlay} aria-hidden="true">
      <div className={styles.stage}>
        <div className={styles.glowTop} />
        <div className={styles.glowBottom} />
        <div className={styles.grain} />

        <svg
          className={styles.sketch}
          viewBox="0 0 800 400"
          preserveAspectRatio="xMidYMid meet"
          aria-hidden="true"
        >
          <path
            className={styles.sketchSine}
            d="M40 220 C 140 120, 220 320, 320 220 S 500 120, 600 220 S 760 320, 780 220"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
          />
          <path
            className={styles.sketchUnderline}
            d="M210 308 C 320 296, 470 296, 600 312"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </svg>

        <div className={styles.chips} aria-hidden="true">
          <span className={`${styles.chip} ${styles.chipA}`}>∫ x² dx</span>
          <span className={`${styles.chip} ${styles.chipB}`}>π</span>
          <span className={`${styles.chip} ${styles.chipC}`}>Σ aᵢ</span>
          <span className={`${styles.chip} ${styles.chipD}`}>∂y / ∂x</span>
          <span className={`${styles.chip} ${styles.chipE}`}>√2</span>
          <span className={`${styles.chip} ${styles.chipF}`}>= ?</span>
        </div>

        <div className={styles.brand}>
          <span className={styles.eyebrow}>
            <span className={styles.eyebrowDot} />
            AI Math Chat
          </span>
          <span className={styles.wordmark}>
            Hỏi bài<span className={styles.dot}>.</span>
          </span>
          <span className={styles.tagline}>
            Học · Soạn bài · Xuất file
          </span>
        </div>
      </div>

      <div className={styles.doorStage}>
        <div className={styles.centerSlit} />
        <div className={`${styles.door} ${styles.leftDoor}`} />
        <div className={`${styles.door} ${styles.rightDoor}`} />
      </div>
    </div>
  );
}
