import sharp from "sharp";

/**
 * Resizes an image to o given size
 * @param image Image to resize
 * @param width Final width
 * @param height Final height
 * @param kernel Algorithm to use in resize process
 */
async function resizeImage(image: Buffer, width: number, height: number, fit: keyof sharp.FitEnum = "inside", kernel: keyof sharp.KernelEnum = "mitchell") {
    const output = await sharp(image).resize({ width: width, height: height, fit: fit, kernel: kernel }).png({ quality: 100 }).toBuffer()

    return output
}

export default resizeImage