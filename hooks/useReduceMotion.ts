import { useEffect, useState } from "react";
import { AccessibilityInfo } from "react-native";

// Mirrors the OS-level "reduce motion" accessibility setting. Screens with
// decorative loop/entrance animations (podium float, shimmer, pulse, slide-in)
// should check this and skip straight to the end state instead of animating.
export function useReduceMotion(): boolean {
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
    const sub = AccessibilityInfo.addEventListener("reduceMotionChanged", setReduceMotion);
    return () => sub.remove();
  }, []);

  return reduceMotion;
}
