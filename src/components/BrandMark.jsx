export default function BrandMark({ className = "", labelled = false }) {
  return (
    <img
      src="/images/aavesh-logo-white.png"
      alt={labelled ? "AAVESH" : ""}
      aria-hidden={labelled ? undefined : true}
      className={`inline-block object-contain ${className}`}
      loading="eager"
    />
  )
}
