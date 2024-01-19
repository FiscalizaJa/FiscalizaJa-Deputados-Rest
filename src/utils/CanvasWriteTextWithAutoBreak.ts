import type { CanvasRenderingContext2D } from "canvas";

/**
 * Writes a text on canvas context, with auto breaking of lines.
 * @param ctx Canvas context
 * @param text Text to be written
 * @param x X position
 * @param y Y position
 * @param maxWidth Text width, will break line if exceeded
 * @param lineHeight Height of lines
 * @returns Contexto do canvas
 */
function CanvasWriteTextWithAutoBreak(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number): { ctx: CanvasRenderingContext2D, y: number } {
    const words = text.split(" ")
    let line = ""

    for (let n = 0; n < words.length; n++) {
        const testLine = line + words[n] + " "
        const metrics = ctx.measureText(testLine)
        const testWidth = metrics.width
        
        if (testWidth > maxWidth && n > 0) {
            ctx.fillText(line, x, y)
            line = words[n] + " "
            y += lineHeight
        } else {
            line = testLine
        }
    }

    ctx.fillText(line, x, y)
    return {
        ctx: ctx,
        y: y
    }
}

export default CanvasWriteTextWithAutoBreak