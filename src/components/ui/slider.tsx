
import * as React from "react"
import * as SliderPrimitive from "@radix-ui/react-slider"

import { cn } from "@/lib/utils"

const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>
>(({ className, ...props }, ref) => (
  <SliderPrimitive.Root
    ref={ref}
    className={cn(
      "relative flex w-full touch-none select-none items-center",
      "py-3 px-2", // Extra padding for easier touch
      className
    )}
    style={{ 
      touchAction: 'pan-x',
      WebkitTouchCallout: 'none',
      WebkitUserSelect: 'none',
      userSelect: 'none'
    }}
    {...props}
  >
    <SliderPrimitive.Track className={cn(
      "relative h-3 w-full grow overflow-hidden rounded-full bg-secondary",
      "md:h-2" // Thicker on mobile for easier interaction
    )}>
      <SliderPrimitive.Range className="absolute h-full bg-primary" />
    </SliderPrimitive.Track>
    <SliderPrimitive.Thumb 
      className={cn(
        "block h-7 w-7 rounded-full border-2 border-primary bg-background",
        "ring-offset-background transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        "disabled:pointer-events-none disabled:opacity-50",
        "hover:scale-110 active:scale-125 transition-transform duration-150",
        "shadow-lg hover:shadow-xl",
        "cursor-grab active:cursor-grabbing",
        "md:h-5 md:w-5" // Larger on mobile for better touch
      )}
      style={{ 
        touchAction: 'pan-x',
        WebkitTouchCallout: 'none',
        WebkitUserSelect: 'none',
        userSelect: 'none'
      }}
    />
  </SliderPrimitive.Root>
))
Slider.displayName = SliderPrimitive.Root.displayName

export { Slider }
