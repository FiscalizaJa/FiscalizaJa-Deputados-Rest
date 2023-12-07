/**
 * Administration Routes
 * I recommend hidding this from documentation
 */

import { FastifyInstance } from "fastify";
import UseDatabase from "../structures/Database";
import { timingSafeEqual } from "crypto";
import startSaveProcess from "../dataProcessors/expenses";

export default async function load(app: FastifyInstance) {

    const database = UseDatabase()

    app.addHook("preHandler", (req, res, done) => {
        const authToken: string = req.headers["x-fiscalizaja-token"] as string

        try {
            const isEqual = timingSafeEqual(Buffer.from(authToken), Buffer.from(process.env.SECRET_TOKEN))
            if(!isEqual) {
                return res.status(403).send({
                    error: "Unauthorized"
                })
            } else {
                done()
            }
        } catch(e) {
            return res.status(403).send({
                error: "Unauthorized"
            })
        }
    })

    app.get("/trigger-update", {
        schema: {
            hide: true
        }
    }, async (req, res) => {
        startSaveProcess(true)

        return {
            message: "O processo de atualização foi disparado."
        }
    })

}

export const route_config = {
    prefix: "/adm"
}