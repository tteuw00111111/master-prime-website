interface ExperienceImageProps {
  src?: string
  alt?: string
  width?: number
  height?: number
  brief: string
}

export const ExperienceImage = ({ src, alt, width, height, brief }: ExperienceImageProps) => {
  // Render only real, approved Master Prime imagery. `brief` documents the desired evidence slot.
  if (!src || !alt || !width || !height) return null

  return (
    <div className="container-custom mt-10">
      <figure className="overflow-hidden rounded-3xl border border-gold/20 bg-dark-card">
        <img src={src} alt={alt} width={width} height={height} loading="lazy" className="h-auto w-full object-cover" />
        <figcaption className="px-5 py-3 text-sm text-gray-400">{brief}</figcaption>
      </figure>
    </div>
  )
}
