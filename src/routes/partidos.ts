import { FastifyInstance } from "fastify";
import axios from "axios";
import schemas from "../schemas/routes";

export default async function load(app: FastifyInstance) {

    let request = await axios.get("https://dadosabertos.camara.leg.br/api/v2/partidos?itens=100&ordem=ASC&ordenarPor=sigla", {
        headers: {
            'Content-Type': "application/json"
        }
    })

    setInterval(async () => {
        axios.get("https://dadosabertos.camara.leg.br/api/v2/partidos?itens=100&ordem=ASC&ordenarPor=sigla", {
            headers: {
                'Content-Type': "application/json"
            }
        }).then((data) => {
            request = data
        }).catch(() => {
            // Não faça nada se a request falhar. Os dados antigos permancerão
        })
    }, 43200000) // Atualiza a cada 12 horas

    app.get("/", {
        schema: schemas.PARTIDOS
    }, async (req, res) => {
        return res.status(200).send({
            data: request.data.dados
        })
    })

}

export const route_config = {
    prefix: "/partidos"
}