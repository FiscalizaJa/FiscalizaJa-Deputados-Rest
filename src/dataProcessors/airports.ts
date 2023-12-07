import Downloader from "../structures/Downloader";
import UseDatabase from "../structures/Database";
import { prepareDatabase } from "../structures/Database";
import paginate from "../paginate";
import Colors from "colors";
import fs from "fs";

const downloader = new Downloader()

const database = UseDatabase()

async function download() {
    if(fs.existsSync(`./data/airports_br.json`)) {
        fs.unlinkSync(`./data/airports_br.json`)
    }

    console.log(Colors.green("Downloading airports from github."))
    await downloader.download_airports_data()
    console.log(Colors.green("Downloaded!"))
}

async function processAndSave() {
    await prepareDatabase()

    const json = await import("../../data/airports_br.json");

    const keys = Object.keys(json)

    const airports = []

    for(const key of keys) {
        airports.push(json[key])
    }
    console.log(Colors.yellow(`Identified ${airports.length} airports, just wait saving...`))

    const columns = Object.keys(airports[0])

    await database.begin(async (sql) => {
        const chunks = paginate(airports, 400)

        let chunk = chunks.next()

        while(!chunk.done && chunk.value) {
            await sql`INSERT INTO "Aeroportos" ${sql(chunk.value, columns)}`
            chunk = chunks.next()
        }
    })

    console.log(Colors.green("Saved!"))
    await database.end()
}

async function runSequential() {
    await download()
    await processAndSave()
}

runSequential()