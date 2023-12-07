import { FastifyInstance } from "fastify";

export default async function load(app: FastifyInstance) {

    app.get("/", async (req, res) => {
        return {
            hello: "world!"
        }
    })

}

export const route_config = {
    prefix: "/"
}