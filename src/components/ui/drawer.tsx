import * as React from 'react'
import { cn } from '@/utils/cn'

interface DrawerContextValue {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const DrawerContext = React.createContext<DrawerContextValue | null>(null)

function useDrawerContext() {
  const context = React.useContext(DrawerContext)
  if (!context) {
    throw new Error('Drawer components must be used within a Drawer provider')
  }
  return context
}

interface DrawerProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  children: React.ReactNode
}

function Drawer({ open = false, onOpenChange, children }: DrawerProps) {
  const [internalOpen, setInternalOpen] = React.useState(false)
  const isOpen = open ?? internalOpen
  const handleOpenChange = onOpenChange ?? setInternalOpen

  // Debug logging
  React.useEffect(() => {
    console.log('[Drawer] State:', { open, internalOpen, isOpen })
  }, [open, internalOpen, isOpen])

  return (
    <DrawerContext.Provider value={{ open: isOpen, onOpenChange: handleOpenChange }}>
      {children}
    </DrawerContext.Provider>
  )
}

interface DrawerTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean
}

const DrawerTrigger = React.forwardRef<HTMLButtonElement, DrawerTriggerProps>(
  ({ onClick, ...props }, ref) => {
    const { onOpenChange } = useDrawerContext()

    return (
      <button
        ref={ref}
        type="button"
        onClick={(e) => {
          onOpenChange(true)
          onClick?.(e)
        }}
        {...props}
      />
    )
  }
)
DrawerTrigger.displayName = 'DrawerTrigger'

const DrawerClose = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ onClick, ...props }, ref) => {
  const { onOpenChange } = useDrawerContext()

  return (
    <button
      ref={ref}
      type="button"
      onClick={(e) => {
        onOpenChange(false)
        onClick?.(e)
      }}
      {...props}
    />
  )
})
DrawerClose.displayName = 'DrawerClose'

const DrawerOverlay = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  const { onOpenChange } = useDrawerContext()

  return (
    <div
      ref={ref}
      onClick={() => onOpenChange(false)}
      className={cn(
        'fixed inset-0 z-50 bg-black/80 transition-opacity duration-300',
        className
      )}
      {...props}
    />
  )
})
DrawerOverlay.displayName = 'DrawerOverlay'

interface DrawerContentProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Whether to prevent closing when clicking outside or pressing ESC
   */
  preventClose?: boolean
  /**
   * Callback when user attempts to close but it's prevented
   */
  onCloseAttempt?: () => void
}

const DrawerContent = React.forwardRef<HTMLDivElement, DrawerContentProps>(
  ({ className, children, preventClose = false, onCloseAttempt, ...props }, ref) => {
    const { open, onOpenChange } = useDrawerContext()
    const [isDragging, setIsDragging] = React.useState(false)
    const [dragY, setDragY] = React.useState(0)
    const contentRef = React.useRef<HTMLDivElement>(null)
    const startYRef = React.useRef(0)

    // Handle escape key
    React.useEffect(() => {
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          if (preventClose) {
            onCloseAttempt?.()
          } else {
            onOpenChange(false)
          }
        }
      }
      if (open) {
        document.addEventListener('keydown', handleEscape)
        document.body.style.overflow = 'hidden'
      }
      return () => {
        document.removeEventListener('keydown', handleEscape)
        document.body.style.overflow = ''
      }
    }, [open, onOpenChange, preventClose, onCloseAttempt])

    // Handle drag to close (mobile)
    const handleDragStart = (e: React.TouchEvent | React.MouseEvent) => {
      if (preventClose) return
      setIsDragging(true)
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
      startYRef.current = clientY
    }

    const handleDragMove = (e: React.TouchEvent | React.MouseEvent) => {
      if (!isDragging || preventClose) return
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
      const delta = clientY - startYRef.current
      if (delta > 0) {
        setDragY(delta)
      }
    }

    const handleDragEnd = () => {
      if (!isDragging) return
      setIsDragging(false)
      // Close if dragged more than 80px
      if (dragY > 80 && !preventClose) {
        onOpenChange(false)
      }
      setDragY(0)
    }

    const handleOverlayClick = () => {
      if (preventClose) {
        onCloseAttempt?.()
      } else {
        onOpenChange(false)
      }
    }

    // Debug logging
    console.log('[DrawerContent] Rendering, open:', open, 'preventClose:', preventClose)

    if (!open) {
      console.log('[DrawerContent] Not rendering because open is false')
      return null
    }

    return (
      <div className="fixed inset-0 z-50">
        <div
          className="fixed inset-0 bg-black/80 transition-opacity duration-300"
          onClick={handleOverlayClick}
        />
        <div
          ref={ref}
          className={cn(
            // Base styles
            'fixed z-50 bg-background shadow-lg transition-transform duration-300 ease-out',
            // Mobile: bottom sheet
            'inset-x-0 bottom-0 rounded-t-[10px] border-t',
            // Desktop: centered modal
            'md:inset-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2',
            'md:rounded-lg md:border md:max-w-[500px] md:w-full md:max-h-[90vh]',
            className
          )}
          style={{
            transform: isDragging ? `translateY(${dragY}px)` : undefined,
          }}
          onClick={(e) => e.stopPropagation()}
          onTouchStart={handleDragStart}
          onTouchMove={handleDragMove}
          onTouchEnd={handleDragEnd}
          onMouseDown={handleDragStart}
          onMouseMove={handleDragMove}
          onMouseUp={handleDragEnd}
          onMouseLeave={handleDragEnd}
          {...props}
        >
          {/* Drag handle (mobile only) */}
          <div className="md:hidden flex justify-center pt-4 pb-2">
            <div className="w-12 h-1.5 rounded-full bg-muted-foreground/30" />
          </div>
          {/* Close button */}
          <button
            type="button"
            onClick={() => {
              if (preventClose) {
                onCloseAttempt?.()
              } else {
                onOpenChange(false)
              }
            }}
            className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4"
            >
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
            <span className="sr-only">Close</span>
          </button>
          <div ref={contentRef} className="px-6 pb-6 pt-2 md:pt-6 overflow-y-auto max-h-[80vh] md:max-h-[calc(90vh-2rem)]">
            {children}
          </div>
        </div>
      </div>
    )
  }
)
DrawerContent.displayName = 'DrawerContent'

const DrawerHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn('flex flex-col space-y-1.5 text-center sm:text-left', className)}
    {...props}
  />
)
DrawerHeader.displayName = 'DrawerHeader'

const DrawerFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn('flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2', className)}
    {...props}
  />
)
DrawerFooter.displayName = 'DrawerFooter'

const DrawerTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h2
    ref={ref}
    className={cn('text-lg font-semibold leading-none tracking-tight', className)}
    {...props}
  />
))
DrawerTitle.displayName = 'DrawerTitle'

const DrawerDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn('text-sm text-muted-foreground', className)}
    {...props}
  />
))
DrawerDescription.displayName = 'DrawerDescription'

export {
  Drawer,
  DrawerTrigger,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerFooter,
  DrawerTitle,
  DrawerDescription,
}
