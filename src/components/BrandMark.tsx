type BrandMarkProps = {
  className?: string
  labelled?: boolean
}

export default function BrandMark({
  className = "",
  labelled = false,
}: BrandMarkProps) {
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
