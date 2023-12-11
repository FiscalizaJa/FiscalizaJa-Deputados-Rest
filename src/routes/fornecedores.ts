import { FastifyInstance } from "fastify";
import UseDatabase from "../structures/Database";
import schemas from "../schemas/routes";

const database = UseDatabase()

/**
 * SEARCHING ALGORITHM
 * Due to invalid CNPJS, names mispelled and other various irregularities in expenses data, i needed to make a custom way to search, to ensure that the max possible number of expenses can be reached
 */

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
            pagina?: string,
            mes?: number | number[]
        } = req.query

        params.cnpj = params.cnpj.replace(/[^0-9]/g, "")

        // usar parseInt, pois o isNaN retorna "true" para Infinity (coisas zoadas do javascript)
        if(isNaN(parseInt(query.pagina || "0")) || isNaN(parseInt(query.itens || "0"))) {
            return res.status(400).send({
                error: "As queries \"itens, pagina\" devem ser númericas."
            })
        }

        if(Array.isArray(query.mes)) {
            if(query.mes.length > 12) {
                return res.status(400).send({
                    error: "Você pode especificar, no máximo até 12 meses"
                })
            }

            query.mes = query.mes.filter(m => Number(m) <= 12 && Number(m) >= 1)
        } else {
            if(query.mes) {
                if(Number(query.mes) > 12 || Number(query.mes) < 1) {
                    return res.status(400).send({
                        error: ""
                    })
                }

                query.mes = [query.mes]
            } else {
                query.mes = new Array(12).fill(0).map((_, index) => (index + 1));
            }
        }

        query.itens = Math.max(Number(query.itens) || 0, FORNECEDOR_MAX).toString()

        const offset = Number(query.itens) * Number(query.pagina)

        const search_for = await database`
            SELECT DISTINCT fornecedor
            FROM "Despesas"
            WHERE "cnpjCPF" = ${params.cnpj}
        `

        const fornecedores = await database`
            SELECT
            ano,
            SUM("valorLiquido") AS "valorTotal",
            ARRAY_AGG(DISTINCT "mes") AS meses
            FROM "Despesas"
            WHERE "fornecedor" IN ${database(search_for.map(f => f.fornecedor))}
            AND mes IN ${database(query.mes as any)}
            ${query.idDeputado ? database`AND "numeroDeputadoID" = ${query.idDeputado}` : database``}
            GROUP BY ano
            LIMIT ${query.itens}
            ${Number(query.pagina) > 1 ? database`OFFSET ${offset}` : database``}
        `

        return {
            nomesVariacoes: search_for?.map(f => f.fornecedor) || null,
            meses: query.mes,
            data: fornecedores
        }
    })
}

export const route_config = {
    prefix: "/fornecedores"
}