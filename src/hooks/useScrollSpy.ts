import { useEffect, useState } from 'react'

/**
 * Hook to detect which section is currently in view
 * @param sectionIds - Array of section IDs to observe
 * @param offset - Offset from top in pixels (default: 100)
 * @returns The ID of the currently active section
 */
export const useScrollSpy = (sectionIds: string[], offset: number = 100): string => {
  const [activeSection, setActiveSection] = useState<string>('')

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + offset

      for (let i = sectionIds.length - 1; i >= 0; i--) {
        const section = document.getElementById(sectionIds[i])
        if (section) {
          const sectionTop = section.offsetTop
          const sectionBottom = sectionTop + section.offsetHeight

          if (scrollPosition >= sectionTop && scrollPosition < sectionBottom) {
            setActiveSection(sectionIds[i])
            break
          }
        }
      }
    }

    handleScroll() // Call once on mount
    window.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [sectionIds, offset])

  return activeSection
}
