import { FastifyInstance } from "fastify";
import UseDatabase from "../structures/Database";
import schemas from "../schemas/routes";

const database = UseDatabase()

/**
 * SEARCHING ALGORITHM
 * Due to invalid CNPJS, names mispelled and other various irregularities in expenses data, i needed to make a custom way to search, to ensure that the max possible number of expenses can be reached
 */

const FORNECEDOR_MAX = 150
const SEARCH_LIMIT = 15
const SEARCH_TERM_MAX_LENGTH = 120

export default async function load(app: FastifyInstance) {
    app.get("/:cnpj", {
        schema: schemas.FORNECEDORES
    }, async (req, res) => {
        const params: {
            cnpj?: string
        } = req.params
        
        const query: {
            idDeputado?: string,
            mes?: number | number[]
        } = req.query

        params.cnpj = params.cnpj.replace(/[^0-9]/g, "")

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
                        error: "O mês é entre 1 e 12."
                    })
                }

                query.mes = [query.mes]
            } else {
                query.mes = new Array(12).fill(0).map((_, index) => (index + 1));
            }
        }

        const search_for = await database`
            SELECT nome
            FROM "NomesFornecedores"
            WHERE "cnpjCPF" = ${params.cnpj}
        `

        const nomes = search_for?.map(f => f.nome) || []

        const fornecedores = await database`
            WITH filtered_data AS (
                SELECT *
                FROM "Despesas"
                WHERE "fornecedor" IN ${database(nomes)}
                AND mes IN ${database(query.mes)}
                ${query.idDeputado ? database`AND "numeroDeputadoID" = ${query.idDeputado}` : database``}
            )
            SELECT
                ano,
                SUM("valorLiquido") AS "valorTotal",
                ARRAY_AGG(DISTINCT "mes") AS meses
            FROM filtered_data
            GROUP BY ano;
        `

        return {
            nomesVariacoes: nomes || null,
            meses: query.mes,
            data: fornecedores
        }
    })

    app.get("/:cnpj/ranking", {
        schema: {
            hide: true
        }
    }, async (req, res) => {
        const params: {
            cnpj?: string
        } = req.params
        
        const query: {
            mes?: number | number[],
            ano?: number | number[]
        } = req.query

        params.cnpj = params.cnpj.replace(/[^0-9]/g, "")

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
                        error: "O mês é entre 1 e 12."
                    })
                }

                query.mes = [query.mes]
            } else {
                query.mes = new Array(12).fill(0).map((_, index) => (index + 1));
            }
        }

        if(Array.isArray(query.ano)) {
            query.ano = Math.round(query.ano[0])
        }

        if(!query.ano) {
            query.ano = new Date().getFullYear()
        }

        if(isNaN(parseInt(query.ano as any)) || query.ano > new Date().getFullYear() || query.ano < 2009) {
            return res.status(200).send({
                error: `O ano é entre ${new Date().getFullYear()} e 2009.`
            })
        }

        const search_for = await database`
            SELECT nome
            FROM "NomesFornecedores"
            WHERE "cnpjCPF" = ${params.cnpj}
        `

        const ranking_deputados = await database`
            WITH filtered_data AS (
                SELECT "nomeParlamentar",
                    "numeroDeputadoID",
                    "valorLiquido",
                    "mes",
                    ano
                FROM "Despesas"
                WHERE "fornecedor" IN ${database(search_for.map(f => f.nome))}
                AND mes IN ${database(query.mes)}
                AND ano = ${query.ano}
            )
            SELECT
                "nomeParlamentar",
                "numeroDeputadoID",
                SUM("valorLiquido") AS "valorTotal",
                COUNT(*) AS "contratacoes",
                ARRAY_AGG(DISTINCT "mes") AS meses,
                ano
            FROM filtered_data
            GROUP BY ano, "nomeParlamentar", "numeroDeputadoID"
            ORDER BY "valorTotal" DESC
            LIMIT 30;
        `

        return {
            ranking: ranking_deputados
        }
    })

    app.get("/pesquisa", async (req, res) => {
        const params = req.query as { termo: string }

        if(!params.termo) {
            return res.status(400).send({
                error: "Envie um termo para fazer a pesquisa."
            })
        }

        if(params.termo.length > SEARCH_TERM_MAX_LENGTH) {
            return res.status(400).send({
                error: `O termo pode ter no máximo ${SEARCH_TERM_MAX_LENGTH} caracteres.`
            })
        }

        const nomes = await database`
            SELECT MAX("cnpjCPF") as "cnpjCPF", ARRAY_AGG(nome) as nomes FROM "NomesFornecedores" WHERE nome_vetor @@ plainto_tsquery('portuguese', ${params.termo}) GROUP BY "cnpjCPF" LIMIT ${SEARCH_LIMIT}
        `

        return {
            data: nomes
        }
    })
} // IMPLEMENTAR: correções de SEO, investigar porque a db travou e é isso

export const route_config = {
    prefix: "/fornecedores"
}