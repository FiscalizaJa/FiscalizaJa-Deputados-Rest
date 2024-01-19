/**
 * Gerador de imagens com opencv4.
 */
import fs from "fs/promises";
import fsSync from "fs";
import Canvas from "canvas";
import CanvasWriteTextWithAutoBreak from "../utils/CanvasWriteTextWithAutoBreak"
import resizeImage from "../utils/resizeImage";
import DownloadFileWithoutStream from "../utils/DownloadFileWithoutStream";
import GetAgeFromDate from "../utils/GetAgeFromDate"

import config from "../../config.json";

import UseDatabase from "./Database";

import type { Deputy } from "../interfaces/Deputy";

const logo = fsSync.readFileSync(`./images/vault.png`)

const database = UseDatabase()

const PHOTO_WIDTH = config.social_banner.photo.width
const PHOTO_HEIGHT = config.social_banner.photo.height
const PHOTO_POSITION_X = 0
const PHOTO_POSITION_Y = 0

const TEXTAREA_WIDTH = config.social_banner.text_area.width
const TEXTAREA_LEFT_PADDING = config.social_banner.text_area.left_padding
const TEXTAREA_TITLE_HEIGHT = config.social_banner.text_area.title.height

const SUMMARY_y = config.social_banner.text_area.summary.y
const SUMMARY_MAX_WIDTH = config.social_banner.text_area.summary.maxWidth
const SUMMARY_LINE_HEIGHT = config.social_banner.text_area.summary.lineHeight

const TOTALS_INITIAL_MARGIN_TOP = config.social_banner.text_area.totals.initialMarginTop
const TOTALS_MARGIN_TOP = config.social_banner.text_area.totals.marginTop
const TOTALS_MAX_WIDTH = config.social_banner.text_area.totals.maxWidth
const TOTALS_LINE_HEIGHT = config.social_banner.text_area.totals.lineHeight

const LOGO_WIDTH = config.social_banner.logo.width
const LOGO_HEIGHT = config.social_banner.logo.height
const LOGO_X = config.social_banner.logo.x
const LOGO_Y = config.social_banner.logo.y

/**
 * Lookup deputy images and returns them.
 * Auto generate and save if they don't have saved (on demand generation).
 * @param idCamara ID of deputy.
 */
async function LookupDeputyImage(idCamara: number) {
    const lookup = fsSync.existsSync(`./api_images/${idCamara}.png`)
    let imageBuffer: Buffer;

    if(!lookup) {
        imageBuffer = await generateAndSaveImage(idCamara)
    } else {
        imageBuffer = await fs.readFile(`./api_images/${idCamara}.png`)
    }

    return imageBuffer
}

async function RefreshDeputyImage(idCamara: number) {

}

// i try to make this not complex, but if canvas is used, is impossible.
// Eu tentei fazer isso não ser complexo, mas se canvas é usado, é impossível.
async function generateAndSaveImage(idCamara: number) {
    const date = new Date()

    const deputy_data = await getDeputy(idCamara)
    if(!deputy_data) {
        return null
    }

    const total = await getTotalGasto(idCamara, date.getFullYear())

    const photo = await DownloadFileWithoutStream(`https://www.camara.leg.br/internet/deputado/bandep/pagina_do_deputado/${idCamara}.jpg`)
    const processed_photo = await resizeImage(photo, PHOTO_WIDTH, PHOTO_HEIGHT, "cover")
    const photo_canvas = await Canvas.loadImage(processed_photo)
    
    const processed_logo = await resizeImage(logo, LOGO_WIDTH, LOGO_HEIGHT, "inside")
    const logo_canvas = await Canvas.loadImage(processed_logo)

    const canvas = Canvas.createCanvas(photo_canvas.width + TEXTAREA_WIDTH, photo_canvas.height)
    const ctx = canvas.getContext("2d", { alpha: false })

    ctx.imageSmoothingEnabled = false
    ctx.quality = "best"
    ctx.patternQuality = "best"

    ctx.fillStyle = "#F3F8F2"
    ctx.fillRect(photo_canvas.width, 0, canvas.width, canvas.height)
   
    ctx.drawImage(photo_canvas, PHOTO_POSITION_X, PHOTO_POSITION_Y, photo_canvas.width, photo_canvas.height)
    ctx.drawImage(logo_canvas, LOGO_X, LOGO_Y, logo_canvas.width, logo_canvas.height)

    ctx.font = 'bold 18px sans-serif'
    ctx.fillStyle = "#34312D"

    ctx.fillText(deputy_data.nome, photo_canvas.width + TEXTAREA_LEFT_PADDING, TEXTAREA_TITLE_HEIGHT)

    ctx.font = 'normal 17px Sans-Serif'
    const summary = CanvasWriteTextWithAutoBreak(ctx, `${deputy_data.siglaSexo === "M" ? "Nascido" : "Nascida"} na cidade de ${deputy_data.municipioNascimento}, ${deputy_data.nome.split(" ")[0]} atua pelo ${deputy_data.siglaPartido} e tem ${GetAgeFromDate(deputy_data.dataNascimento)} anos de idade.`, photo_canvas.width + TEXTAREA_LEFT_PADDING, SUMMARY_y, SUMMARY_MAX_WIDTH, SUMMARY_LINE_HEIGHT)
    
    ctx.font = 'normal 17px sans-serif'
    CanvasWriteTextWithAutoBreak(ctx, `Gastou R$ ${Number(total).toLocaleString("pt-br")} em ${date.getFullYear()}.`, photo_canvas.width + TEXTAREA_LEFT_PADDING, summary.y + TOTALS_INITIAL_MARGIN_TOP, TOTALS_MAX_WIDTH, TOTALS_LINE_HEIGHT)


    const image = canvas.toBuffer("image/png")
    await fs.writeFile(`./api_images/${idCamara}.png`, image)
    return image
}

async function getDeputy(id: number): Promise<Deputy | null> {
    const data: Deputy[] = await database`
        SELECT * FROM "Deputados"
        WHERE "idCamara" = ${id} AND operational = ${1}
    `

    return data[0] || null
}

async function getTotalGasto(id: number, year: number = new Date().getFullYear()) {
    const data: {total: number}[] = await database`
        SELECT SUM("valorLiquido") as total
        FROM "Despesas"
        WHERE "numeroDeputadoID" = ${id} AND ano = ${year}
    `

    return data[0]?.total || 0
}

export default {
    LookupDeputyImage
}