import styles from "./marketing.module.css";

type HeroDecorProps = {
  chips?: string[];
  variant?: "wave" | "grid" | "both";
};

export function HeroDecor({ chips = [], variant = "both" }: HeroDecorProps) {
  return (
    <div className={styles.heroSketch} aria-hidden="true">
      {(variant === "wave" || variant === "both") && (
        <svg className={styles.sineWave} viewBox="0 0 600 200" preserveAspectRatio="none">
          <path d="M0 100 C 75 20, 150 180, 225 100 S 375 20, 450 100 S 600 180, 600 100" />
          <path d="M0 130 C 75 60, 150 200, 225 130 S 375 60, 450 130 S 600 200, 600 130" opacity="0.5" />
        </svg>
      )}
      {(variant === "grid" || variant === "both") && (
        <svg className={styles.gridDots} viewBox="0 0 200 200">
          <defs>
            <pattern id="dotPattern" x="0" y="0" width="14" height="14" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="1.2" fill="hsl(15 63% 60%)" />
            </pattern>
          </defs>
          <rect width="200" height="200" fill="url(#dotPattern)" />
        </svg>
      )}
      {chips[0] && <span className={`${styles.chip} ${styles.chip1}`}>{chips[0]}</span>}
      {chips[1] && <span className={`${styles.chip} ${styles.chip2}`}>{chips[1]}</span>}
      {chips[2] && <span className={`${styles.chip} ${styles.chip3}`}>{chips[2]}</span>}
    </div>
  );
}
