// src/Pages/Intro/IntroPage.jsx
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import desktopVideo from "../../assets/desktop_synara_animation.mp4";
import mobileVideo from "../../assets/mobile_synara_animation.mp4"; // <-- change to your mobile file's name
import poster from "../../assets/synara-intro-poster.jpg";
import styles from "./Intro.module.css";

/*
  Where to go when the animation ends.
    "/welcome" = your Splash page (it has the "Next" button)
    "/home"    = skip the splash and go straight to the home page
*/
const NEXT_PATH = "/welcome";

const SEEN_KEY = "synara-intro-seen"; // the animation plays once per browser session
const FADE_MS = 350;
const MAX_WAIT_MS = 12000;            // safety net: never trap anyone on this screen

// phones, and any portrait screen (including tablets held upright), get the mobile video
const MOBILE_QUERY = "(orientation: portrait), (max-width: 639px)";

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() => window.matchMedia(MOBILE_QUERY).matches);
  useEffect(() => {
    const mq = window.matchMedia(MOBILE_QUERY);
    const onChange = () => setIsMobile(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return isMobile;
}

export default function IntroPage() {
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const leaving = useRef(false);
  const isMobile = useIsMobile();
  const [fading, setFading] = useState(false);
  const [blocked, setBlocked] = useState(false); // browser refused to autoplay

  const finish = useCallback(() => {
    if (leaving.current) return;
    leaving.current = true;
    try {
      // sessionStorage.setItem(SEEN_KEY, "1"); 
    } catch {
      /* storage blocked: the intro may play again, which is fine */
    }
    setFading(true);
    setTimeout(() => navigate(NEXT_PATH, { replace: true }), FADE_MS);
  }, [navigate]);

  useEffect(() => {
    // already seen this session, or the person asked for less motion: skip straight on
    let seen = false;
    try {
      seen = sessionStorage.getItem(SEEN_KEY) === "1";
    } catch {
      /* ignore */
    }
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (seen || reduce) {
      leaving.current = true;
      navigate(NEXT_PATH, { replace: true });
      return;
    }

    const v = videoRef.current;
    v?.play?.().catch(() => setBlocked(true));
    const t = setTimeout(finish, MAX_WAIT_MS);
    return () => clearTimeout(t);
  }, [navigate, finish]);

  return (
    <div className={fading ? `${styles.screen} ${styles.fade}` : styles.screen}>
      <video
        key={isMobile ? "mobile" : "desktop"}   /* a new video element when the screen shape changes */
        ref={videoRef}
        className={isMobile ? `${styles.video} ${styles.videoMobile}` : styles.video}
        src={isMobile ? mobileVideo : desktopVideo}
        poster={isMobile ? undefined : poster}  /* the desktop poster is landscape, so phones skip it */
        muted
        playsInline
        autoPlay
        preload="auto"
        disablePictureInPicture
        aria-label="Synara logo animation"
        onEnded={finish}
        onError={finish}
      />

      <button type="button" className={styles.skip} onClick={finish}>
        {blocked ? "Tap to continue" : "Skip"}
      </button>
    </div>
  );
}