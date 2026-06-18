// Wordmark. In the Aurora direction the signature is the ambient aurora behind
// the hero, so the mark stays clean: "Pulse" carries the violet->teal gradient.
export default function PulseMark({ size = "lg" }: { size?: "lg" | "sm" }) {
  const isLg = size === "lg";
  return (
    <span
      className={`font-display font-bold tracking-tight text-ink ${
        isLg ? "text-2xl" : "text-lg"
      }`}
      aria-label="CreatorPulse"
    >
      Creator
      <span className="bg-gradient-to-r from-violet to-teal bg-clip-text text-transparent">
        Pulse
      </span>
    </span>
  );
}
