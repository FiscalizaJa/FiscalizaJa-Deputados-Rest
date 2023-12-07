import fs from "fs/promises";
import { FastifyInstance } from "fastify";

async function startRouter(webserver: FastifyInstance) {
    const routeFiles = await fs.readdir("./src/routes")

    for (const file of routeFiles) {
        const filename = file.split(".")[0]
        const file_data = await import(`../routes/${filename}`)

        const configs = file_data.route_config

        webserver.register(async (app, _, done) => {
            await file_data.default(app)
            done()
        }, {
            prefix: configs?.prefix || "/" 
        })
    }
}

export default {
    startRouter: startRouter
}