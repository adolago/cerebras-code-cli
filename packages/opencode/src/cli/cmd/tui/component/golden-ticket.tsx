import { TextAttributes, RGBA } from "@opentui/core"
import { useKeyboard, useTerminalDimensions } from "@opentui/solid"
import { createSignal, onMount, onCleanup, For, Show } from "solid-js"

// Sparkle characters for animation
const SPARKLES = ["*", "+", ".", "o", "x", "'", "`"]

const TICKET_ART = [
  `╔══════════════════════════════════════════════════════════════════════╗`,
  `║  * . + . * . + . * . +    GOLDEN   TICKET    + . * . + . * . + . *   ║`,
  `╠══════════════════════════════════════════════════════════════════════╣`,
  `║                                                                      ║`,
  `║    ██████╗███████╗██████╗ ███████╗██████╗ ██████╗  █████╗ ███████╗   ║`,
  `║   ██╔════╝██╔════╝██╔══██╗██╔════╝██╔══██╗██╔══██╗██╔══██╗██╔════╝   ║`,
  `║   ██║     █████╗  ██████╔╝█████╗  ██████╔╝██████╔╝███████║███████╗   ║`,
  `║   ██║     ██╔══╝  ██╔══██╗██╔══╝  ██╔══██╗██╔══██╗██╔══██║╚════██║   ║`,
  `║   ╚██████╗███████╗██║  ██║███████╗██████╔╝██║  ██║██║  ██║███████║   ║`,
  `║    ╚═════╝╚══════╝╚═╝  ╚═╝╚══════╝╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝   ║`,
  `║                                                                      ║`,
  `║                  Welcome to Cerebras Code CLI!                       ║`,
  `║                                                                      ║`,
  `║           You've unlocked the fastest AI coding assistant            ║`,
  `║                                                                      ║`,
  `╠══════════════════════════════════════════════════════════════════════╣`,
  `║  + . * . + . * . + . * . + . * . + . * . + . * . + . * . + . * . +   ║`,
  `╚══════════════════════════════════════════════════════════════════════╝`,
]

// Gold color palette
const GOLD = RGBA.fromHex("#FFD700")
const GOLD_LIGHT = RGBA.fromHex("#FFEC8B")
const GOLD_DARK = RGBA.fromHex("#DAA520")

export function GoldenTicketAnimation(props: { onClose: () => void }) {
  const dimensions = useTerminalDimensions()
  const [ready, setReady] = createSignal(false)
  const [frame, setFrame] = createSignal(0)
  const [sparkles, setSparkles] = createSignal<{x: number, y: number, char: string}[]>([])

  // Generate random sparkle positions
  const generateSparkles = () => {
    const width = dimensions().width
    const height = dimensions().height
    const newSparkles = []
    for (let i = 0; i < 40; i++) {
      newSparkles.push({
        x: Math.floor(Math.random() * width),
        y: Math.floor(Math.random() * height),
        char: SPARKLES[Math.floor(Math.random() * SPARKLES.length)]
      })
    }
    setSparkles(newSparkles)
  }

  // Animation loop
  onMount(() => {
    generateSparkles()
    
    const interval = setInterval(() => {
      setFrame(f => f + 1)
      // Regenerate sparkles every few frames
      if (frame() % 2 === 0) {
        generateSparkles()
      }
    }, 150)

    // Ready to accept key press after a short delay
    setTimeout(() => setReady(true), 500)

    onCleanup(() => clearInterval(interval))
  })

  useKeyboard((evt) => {
    if (ready()) {
      evt.preventDefault?.()
      setReady(false)
      setTimeout(() => props.onClose(), 50)
    }
  })

  // Cycle through gold colors based on frame
  const getGoldColor = (offset: number = 0) => {
    const colors = [GOLD, GOLD_LIGHT, GOLD_DARK, GOLD_LIGHT]
    return colors[(frame() + offset) % colors.length]
  }

  return (
    <box
      position="absolute"
      top={0}
      left={0}
      width={dimensions().width}
      height={dimensions().height}
      backgroundColor={RGBA.fromHex("#1a1a2e")}
      justifyContent="center"
      alignItems="center"
      flexDirection="column"
    >
      {/* Background sparkles */}
      <For each={sparkles()}>
        {(sparkle) => (
          <text
            position="absolute"
            top={sparkle.y}
            left={sparkle.x}
            fg={getGoldColor(sparkle.x)}
          >
            {sparkle.char}
          </text>
        )}
      </For>

      {/* Golden ticket */}
      <box flexDirection="column" alignItems="center">
        <For each={TICKET_ART}>
          {(line, index) => (
            <text 
              fg={getGoldColor(index())} 
              attributes={index() === 1 || index() === TICKET_ART.length - 2 ? TextAttributes.BOLD : 0}
            >
              {line}
            </text>
          )}
        </For>
      </box>

      {/* Press any key message */}
      <box marginTop={2}>
        <text fg={GOLD_LIGHT} attributes={frame() % 2 === 0 ? TextAttributes.BOLD : TextAttributes.DIM}>
          * * * press any key to continue * * *
        </text>
      </box>
    </box>
  )
}

