import { FastifyInstance } from "fastify";
import UseDatabase from "../structures/Database";
import schemas from "../schemas/routes";

const database = UseDatabase()

const MAX_IATAS = 10

export default async function load(app: FastifyInstance) {

    app.get("/", {
        schema: schemas.AEROPORTOS
    }, async (req, res) => {
        const query: {
            iata?: string | string[]
        } = req.query

        if(!query.iata) {
            return res.status(400).send({
                error: `O campo "?iata" é obrigatório.`
            })
        }

        if(!Array.isArray(query.iata)) {
            query.iata = [query.iata]    
        } 

        if(query.iata.length > MAX_IATAS) {
            return res.status(400).send({
                error: `São permitidos ${MAX_IATAS} códigos iatas por vez.`
            })
        }

        const invalidIata = query.iata.find(iata => iata.length > 3)

        if(invalidIata) {
            return res.status(400).send({
                error: `\"${invalidIata}\" Não é um código IATA válido. O código IATA possui no máximo 3 dígitos.`
            })
        }

        query.iata = query.iata.map(iata => iata.toUpperCase())

        const iatasindex = query.iata.reduce((obj, iata, index) => {
            obj[iata] = index;
            return obj;
        }, {});

        const aeroportos = await database`
            SELECT * FROM "Aeroportos" WHERE iata IN ${database(query.iata)} LIMIT ${MAX_IATAS}
        `

        return {
            data: aeroportos.sort((a, b) => iatasindex[a.iata] - iatasindex[b.iata])
        }
    })

}

export const route_config = {
    prefix: "/aeroportos"
}