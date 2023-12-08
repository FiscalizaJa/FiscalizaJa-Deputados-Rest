import { FastifyInstance } from "fastify";
import UseDatabase from "../structures/Database";
import schemas from "../schemas/routes";

const database = UseDatabase()

const FORNECEDOR_MAX = 150

export default async function load(app: FastifyInstance) {
    app.get("/:cnpj", {
        schema: schemas.FORNECEDORES
    }, async (req, res) => {
        const params: {
            cnpj?: string
        } = req.params
        
        const query: {
            idDeputado?: string,
            itens?: string,
            pagina?: string
        } = req.query

        params.cnpj = params.cnpj.replace(/[^0-9]/g, "")

        // usar parseInt, pois o isNaN retorna "true" para Infinity (coisas zoadas do javascript)
        if(isNaN(parseInt(query.pagina || "0")) || isNaN(parseInt(query.itens || "0"))) {
            return res.status(400).send({
                error: "As queries \"itens, pagina\" devem ser númericas."
            })
        }

        query.itens = Math.max(Number(query.itens) || 0, FORNECEDOR_MAX).toString()

        const offset = Number(query.itens) * Number(query.pagina)

        const fornecedores = await database`
            SELECT
            ano,
            SUM("valorLiquido") AS "valorTotal"
            FROM "Despesas"
            WHERE "cnpjCPF" = ${params.cnpj}
            ${query.idDeputado ? database`AND "numeroDeputadoID" = ${query.idDeputado}` : database``}
            GROUP BY ano
            LIMIT ${query.itens}
            ${Number(query.pagina) > 1 ? database`OFFSET ${offset}` : database``}
        `

        const nome = await database`
            SELECT fornecedor
            FROM "Despesas"
            WHERE "cnpjCPF" = ${params.cnpj}
            LIMIT 1
        `

        return {
            fornecedor: nome[0]?.fornecedor || null,
            data: fornecedores
        }
    })
}

export const route_config = {
    prefix: "/fornecedores"
}