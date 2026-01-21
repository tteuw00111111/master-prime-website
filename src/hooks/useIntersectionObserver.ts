import { useEffect, useState, RefObject } from 'react'

interface UseIntersectionObserverOptions extends IntersectionObserverInit {
  freezeOnceVisible?: boolean
}

/**
 * Hook to detect if an element is visible in the viewport
 * @param elementRef - Ref to the element to observe
 * @param options - Intersection Observer options
 * @returns Whether the element is currently intersecting
 */
export const useIntersectionObserver = (
  elementRef: RefObject<Element>,
  options: UseIntersectionObserverOptions = {}
): boolean => {
  const { threshold = 0.1, root = null, rootMargin = '0px', freezeOnceVisible = false } = options

  const [isIntersecting, setIsIntersecting] = useState(false)

  useEffect(() => {
    const element = elementRef.current

    if (!element) return

    // If freezeOnceVisible is enabled and already visible, don't create observer
    if (freezeOnceVisible && isIntersecting) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting)
      },
      { threshold, root, rootMargin }
    )

    observer.observe(element)

    return () => {
      observer.disconnect()
    }
  }, [elementRef, threshold, root, rootMargin, freezeOnceVisible, isIntersecting])

  return isIntersecting
}
