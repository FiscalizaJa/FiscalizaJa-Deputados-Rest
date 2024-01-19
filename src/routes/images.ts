import { FastifyInstance } from "fastify";
import DownloadFileWithStream from "../utils/DownloadFileWithStream";
import DeputyBanners from "../structures/DeputyBanners";

export default async function load(app: FastifyInstance) {
    app.get("/banners/:id", async (req, res) => {
        const params = req.params as {
            id: number
        }

        if(!params.id) {
            return res.status(400).send({
                error: "Informe o ID do deputado."
            })
        }

        const image = await DeputyBanners.LookupDeputyImage(params.id).catch((e) => { null })

        if(!image) {
            const stream = await DownloadFileWithStream(`https://www.camara.leg.br/internet/deputado/bandep/pagina_do_deputado/${params.id}.jpg`).catch(e => null)
            if(!stream) {
                return res.status(404).send({
                    error: "Deputado inválido"
                })
            }
            res.type("image/jpeg")
            return res.status(200).send(stream)
        }

        res.type("image/png")
        res.status(200).send(image)
    })

}

export const route_config = {
    prefix: "/dynamic"
}