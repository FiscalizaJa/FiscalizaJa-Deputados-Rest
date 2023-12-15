import Downloader from "../structures/Downloader";
import fs from "fs";
import Colors from "colors";
import UseDatabase from "../structures/Database";
import { prepareDatabase } from "../structures/Database";
import axios from "axios";

import { Deputy } from "../interfaces/Deputy";
import paginate from "../paginate";

const downloader = new Downloader()

async function get_rest_deputies() {
    return new Promise(async (resolve, reject) => {
        const request = await axios.get("https://dadosabertos.camara.leg.br/api/v2/deputados", {
            headers: {
                'Content-Type': "application/json"
            }
        }).catch((e) => {
            console.error(e)
            return null
        })
    
        resolve(request?.data?.dados.map(d => d.id))
    })
}

async function checkJson() {
    if(fs.existsSync(`./data/deputados.json`)) {
        fs.unlinkSync("./data/deputados.json")
    }

    console.log(Colors.yellow("Downloading deputies"))
    const download = await downloader.download_deputies()
    console.log(Colors.green(`Downloaded in ${download.timeTaken} ms`))
}

async function processJsonStream() {
    const database = UseDatabase()
    await prepareDatabase()

    const rest_deputies = await get_rest_deputies()

    console.log(Colors.yellow("Starting Deputies saving process, please wait..."))

    const data = await import("../../data/deputados.json" as any)

    const deputados: any = data.default.dados.map((deputado: any) => {
        const uri = deputado.uri
        let id: any = uri.split("/")
        id = id[id.length - 1]

        deputado.idCamara = id
        deputado.urlFoto = `https://www.camara.leg.br/internet/deputado/bandep/${id}.jpg`
        return deputado
    }) as Deputy[]

    console.log(Colors.yellow("Commiting transactions"))

    await database.begin(async sql => {
        const columns = Object.keys(deputados[0])
        
        const chunks = paginate(deputados, 1500)
        let chunk = chunks.next()

        while(!chunk.done && chunk.value) {
            await sql`INSERT INTO "Deputados" ${sql(chunk.value, columns)}`
            chunk = chunks.next()
        }

        console.log(Colors.yellow("Getting additional data..."))
        await sql`UPDATE "Deputados" SET operational = 1 WHERE "idCamara" IN ${sql(rest_deputies as any)}`

        await sql`
            UPDATE "Deputados"
            SET "siglaPartido" = (
                SELECT DISTINCT d."siglaPartido"
                FROM "Despesas" d
                WHERE d."numeroDeputadoID" = "Deputados"."idCamara"
                LIMIT 1
            )
        `
        console.log(Colors.yellow("Done!"))

        return true
    })
    
    console.log(Colors.green("Commited!"))
}

async function runSequential() {
    await checkJson()

    await processJsonStream()
}

runSequential()