import { TextAttributes, RGBA } from "@opentui/core"
import { useTheme } from "@tui/context/theme"

// Cerebras orange: RGB 240, 90, 40
const CEREBRAS_ORANGE = RGBA.fromInts(240, 90, 40)

// "C" letter (first letter, colored orange)
const C_LINE1 = `█▀▀▀`
const C_LINE2 = `█░░░`
const C_LINE3 = `▀▀▀▀`

// Rest of "EREBRAS"
const REST_LINE1 = ` █▀▀▀ █▀▀█ █▀▀▀ █▀▀▄ █▀▀█ █▀▀█ █▀▀▀`
const REST_LINE2 = ` █▀▀▀ █▀▀▄ █▀▀▀ █▀▀▄ █▀▀▄ █▀▀█ ▀▀▀█`
const REST_LINE3 = ` ▀▀▀▀ ▀  ▀ ▀▀▀▀ ▀▀▀  ▀  ▀ ▀  ▀ ▀▀▀▀`

// --- Split the Bottom Line for Coloring ---

// Left Bracket [
const B_LEFT1 = `█▀`
const B_LEFT2 = `█ `
const B_LEFT3 = `▀▀`

// Middle " CLI " (White)
// I added spacing here to ensure it doesn't touch the brackets
const CLI_TXT1 = `  █▀▀▀  █░░  ▀█▀  `
const CLI_TXT2 = `  █░░░  █░░  ░█░  `
const CLI_TXT3 = `  ▀▀▀▀  ▀▀▀  ▀▀▀  `

// Right Bracket ]
const B_RIGHT1 = `▀█`
const B_RIGHT2 = ` █`
const B_RIGHT3 = `▀▀`


export function Logo() {
  const { theme } = useTheme()

  // Use theme.text for the "White" pop, or use RGBA.fromInts(255,255,255) if theme.text isn't bright enough
  const whiteColor = theme.text 

  return (
    <box>
      {/* Top Row: CEREBRAS */}
      <text attributes={TextAttributes.BOLD}>
        <span style={{ fg: CEREBRAS_ORANGE }}>{C_LINE1}</span>
        <span style={{ fg: theme.text }}>{REST_LINE1}</span>
      </text>
      <text attributes={TextAttributes.BOLD}>
        <span style={{ fg: CEREBRAS_ORANGE }}>{C_LINE2}</span>
        <span style={{ fg: theme.text }}>{REST_LINE2}</span>
      </text>
      <text attributes={TextAttributes.BOLD}>
        <span style={{ fg: CEREBRAS_ORANGE }}>{C_LINE3}</span>
        <span style={{ fg: theme.text }}>{REST_LINE3}</span>
      </text>

      {/* Bottom Row: [ CLI ] */}
      <text>
        <span style={{ fg: theme.textMuted }}>{B_LEFT1}</span>
        <span style={{ fg: whiteColor, attributes: TextAttributes.BOLD }}>{CLI_TXT1}</span>
        <span style={{ fg: theme.textMuted }}>{B_RIGHT1}</span>
      </text>
      <text>
        <span style={{ fg: theme.textMuted }}>{B_LEFT2}</span>
        <span style={{ fg: whiteColor, attributes: TextAttributes.BOLD }}>{CLI_TXT2}</span>
        <span style={{ fg: theme.textMuted }}>{B_RIGHT2}</span>
      </text>
      <text>
        <span style={{ fg: theme.textMuted }}>{B_LEFT3}</span>
        <span style={{ fg: whiteColor, attributes: TextAttributes.BOLD }}>{CLI_TXT3}</span>
        <span style={{ fg: theme.textMuted }}>{B_RIGHT3}</span>
      </text>
    </box>
  )
}