type BrandMarkProps = {
  className?: string
  labelled?: boolean
}

export default function BrandMark({
  className = "",
  labelled = false,
}: BrandMarkProps) {
  return (
    <svg
      aria-hidden={labelled ? undefined : true}
      aria-label={labelled ? "AAVESH" : undefined}
      className={className}
      fill="none"
      viewBox="0 0 48 48"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M6.5 36.5 21.6 9.4a2.75 2.75 0 0 1 4.8 0l15.1 27.1h-8.7L24 20.4l-5.2 9.5H24l3.7 6.6H6.5Z"
        fill="currentColor"
      />
    </svg>
  )
}
