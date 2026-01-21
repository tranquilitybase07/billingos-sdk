import * as React from 'react'
import { cn } from '@/utils/cn'

interface ScrollAreaProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * The orientation of the scrollable area
   */
  orientation?: 'vertical' | 'horizontal' | 'both'
  
  /**
   * Always show the custom scrollbar (instead of only on hover)
   */
  alwaysShowScrollbar?: boolean
}

const ScrollArea = React.forwardRef<HTMLDivElement, ScrollAreaProps>(
  ({ className, children, orientation = 'vertical', alwaysShowScrollbar = false, ...props }, ref) => {
    const [showScrollbar, setShowScrollbar] = React.useState(false)
    const [scrollbarHeight, setScrollbarHeight] = React.useState(0)
    const [scrollbarTop, setScrollbarTop] = React.useState(0)
    const viewportRef = React.useRef<HTMLDivElement>(null)

    const handleScroll = React.useCallback(() => {
      const viewport = viewportRef.current
      if (!viewport) return

      const { scrollTop, scrollHeight, clientHeight } = viewport

      // Only show scrollbar if there's actually scrollable content
      const hasScrollableContent = scrollHeight > clientHeight
      
      if (!hasScrollableContent && !alwaysShowScrollbar) {
        setScrollbarHeight(0)
        setScrollbarTop(0)
        return
      }

      // Calculate scrollbar dimensions
      const scrollRatio = clientHeight / scrollHeight
      const thumbHeight = Math.max(scrollRatio * clientHeight, 30) // Min 30px
      const maxScrollTop = scrollHeight - clientHeight
      const scrollProgress = maxScrollTop > 0 ? scrollTop / maxScrollTop : 0
      const maxThumbTop = clientHeight - thumbHeight
      const thumbTop = scrollProgress * maxThumbTop

      setScrollbarHeight(hasScrollableContent ? thumbHeight : 0)
      setScrollbarTop(thumbTop)
    }, [alwaysShowScrollbar])

    React.useEffect(() => {
      const viewport = viewportRef.current
      if (!viewport) return

      // Initial calculation
      handleScroll()

      // Create resize observer
      const resizeObserver = new ResizeObserver(handleScroll)
      resizeObserver.observe(viewport)

      // Listen for scroll events
      viewport.addEventListener('scroll', handleScroll)

      return () => {
        resizeObserver.disconnect()
        viewport.removeEventListener('scroll', handleScroll)
      }
    }, [handleScroll])

    const handleScrollbarDrag = React.useCallback(
      (e: React.MouseEvent<HTMLDivElement>) => {
        e.preventDefault()
        const viewport = viewportRef.current
        if (!viewport) return

        const { scrollHeight, clientHeight } = viewport
        const maxScrollTop = scrollHeight - clientHeight
        
        if (maxScrollTop <= 0) return // No scrollable content

        const scrollbarContainer = e.currentTarget.parentElement?.parentElement
        if (!scrollbarContainer) return

        const containerRect = scrollbarContainer.getBoundingClientRect()
        const startY = e.clientY
        const startScrollTop = viewport.scrollTop

        const onMouseMove = (moveEvent: MouseEvent) => {
          const deltaY = moveEvent.clientY - startY
          const containerHeight = containerRect.height
          const scrollRatio = deltaY / containerHeight
          const scrollDelta = scrollRatio * maxScrollTop
          
          const newScrollTop = Math.max(0, Math.min(maxScrollTop, startScrollTop + scrollDelta))
          viewport.scrollTop = newScrollTop
        }

        const onMouseUp = () => {
          document.removeEventListener('mousemove', onMouseMove)
          document.removeEventListener('mouseup', onMouseUp)
          document.body.style.userSelect = ''
          document.body.style.cursor = ''
        }

        document.body.style.userSelect = 'none'
        document.body.style.cursor = 'grabbing'
        document.addEventListener('mousemove', onMouseMove)
        document.addEventListener('mouseup', onMouseUp)
      },
      []
    )

    return (
      <div
        ref={ref}
        className={cn('relative overflow-hidden', className)}
        onMouseEnter={() => setShowScrollbar(true)}
        onMouseLeave={() => setShowScrollbar(false)}
        {...props}
      >
        <div
          ref={viewportRef}
          className={cn(
            'h-full w-full rounded-[inherit]',
            orientation === 'vertical' && 'overflow-y-auto overflow-x-hidden',
            orientation === 'horizontal' && 'overflow-x-auto overflow-y-hidden',
            orientation === 'both' && 'overflow-auto',
            // Hide native scrollbar
            '[&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]'
          )}
        >
          {children}
        </div>

        {/* Custom Scrollbar */}
        {(orientation === 'vertical' || orientation === 'both') && (
          <div
            className={cn(
              'absolute top-0 right-0 w-2.5 h-full transition-opacity duration-150',
              alwaysShowScrollbar || showScrollbar ? 'opacity-100' : 'opacity-0'
            )}
          >
            <div className="relative h-full w-full">
              {/* Track - Make it visible */}
              <div className="absolute inset-0 rounded-full bg-gray-100 hover:bg-gray-200" />
              {/* Thumb */}
              {scrollbarHeight > 0 && (
                <div
                  className="absolute right-0.5 w-1.5 rounded-full bg-gray-400 hover:bg-gray-600 transition-colors cursor-pointer"
                  style={{
                    height: `${scrollbarHeight}px`,
                    top: `${scrollbarTop}px`,
                  }}
                  onMouseDown={handleScrollbarDrag}
                />
              )}
            </div>
          </div>
        )}
      </div>
    )
  }
)
ScrollArea.displayName = 'ScrollArea'

const ScrollBar = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    orientation?: 'vertical' | 'horizontal'
  }
>(({ className, orientation = 'vertical', ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'flex touch-none select-none transition-colors',
      orientation === 'vertical' && 'h-full w-2.5 border-l border-l-transparent p-[1px]',
      orientation === 'horizontal' && 'h-2.5 flex-col border-t border-t-transparent p-[1px]',
      className
    )}
    {...props}
  />
))
ScrollBar.displayName = 'ScrollBar'

export { ScrollArea, ScrollBar }
