import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import UseDatabase from "../structures/Database";
import schemas from "../schemas/routes";

const database = UseDatabase()

const TRAVELS_NUMBER = 40

const LOCATIONS = {
    "aeronaves": [
        119, 0
    ],
    "veiculos": [
        120, 0
    ],
    "embarcacoes": [
        121, 0
    ]
}

const LOCATIONS_NUMBER = 40

const FUELS_NUMBER = 150
const FUELS_FILTERS = {
    "indefinido": [
        3, 4
    ],
    "aeronaves": [
        3, 3
    ],
    "embarcacoes": [
        3, 2
    ],
    "veiculos": [
        3, 1
    ]
}

const ALIMENTATIONS_NUMBER = 40

const ALIMENTATIONS_FILTER = [
    13, 0
]

function getUrlData(req: FastifyRequest, res: FastifyReply, DEFAULT_RETURN_AMOUNT: number): any {
    const params: { id?: number } = req.params
    
    const year = new Date().getFullYear()

    const query: {
        ano?: number,
        mes?: number,
        pagina?: number,
        itens?: number,
        fornecedor?: string
    } = req.query

    if(isNaN(params.id)) {
        return res.status(400).send({
            error: "ID inválido."
        })
    }

    query.itens = Math.round(Math.min(DEFAULT_RETURN_AMOUNT, Number(query.itens) || DEFAULT_RETURN_AMOUNT))

    if(!query.pagina || isNaN(query.pagina)) {
        query.pagina = 1
    }

    const missing = []

    if(!query.ano) {
        missing.push("ano")
    }

    if(!query.mes) {
        missing.push("mes")
    }

    if(missing.length > 0) {
        res.status(400).send({
            error: `Todas as queries para esse endpoint são obrigatórias: ${missing.join(", ")}`
        })
    }

    query.ano = Array.isArray(query.ano) ? Math.round(query.ano[0]): Math.round(query.ano)
    query.mes = Array.isArray(query.mes) ? Math.round(query.mes[0]) : Math.round(query.mes)

    if(isNaN(query.ano) || isNaN(query.mes)) {
        res.status(400).send({
            error: "As queries são numéricas."
        })
    }

    if(query.ano < 2009 || query.ano > year) {
        return res.status(400).send({
            error: `O ano é entre 2009 e ${year}`
        })
    }

    if(query.mes > 12 || query.mes < 1) {
        res.status(400).send({
            error: "O mês é entre 1 e 12"
        })
    }

    query.pagina = Math.round(query.pagina)

    return {
        params: params || null,
        query: query || null
    }
}

async function getCounts(params: any, query: any, filter: number[]) {
    const counts = await database`
        SELECT fornecedor, COUNT(*) AS contratacoes, SUM("valorLiquido") AS "valorGasto", "cnpjCPF" as cnpj
        FROM "Despesas"
        WHERE "numeroDeputadoID" = ${params.id}
        AND "numeroSubCota" = ${filter[0]}
        AND "numeroEspecificacaoSubCota" = ${filter[1]}
        AND mes = ${query.mes}
        AND ano = ${query.ano}
        GROUP BY fornecedor, cnpj
    `

    return counts
}

const DEFAULT_QUERY_STRING_DOC = {
    type: "object",
    properties: {
        ano: {
            type: "array",
            description: "Um ou mais anos de ocorrência das despesas",
            items: {
                type: "number"
            }
        },
        mes: {
            type: "array",
            description: "Um ou mais meses de ocorrência das despesas.",
            items: {
                type: "number"
            }
        },
        fornecedor: {
            type: "string",
            description: "Fornecedor das despesas, pode ser cnpj, cpf ou nome."
        }
    }
}

const DEFAULT_PARAMS_DOC = {
    type: "object",
    properties: {
        id: {
            type: "string"
        }
    }
}

// ROUTER
export default async function load(app: FastifyInstance) {
    app.get("/:id/viagens", {
        schema: schemas.DEPUTADO_VIAGENS
    }, async (req, res) => {
        const { params, query } = getUrlData(req, res, TRAVELS_NUMBER)

        if(res.sent) {
            return;
        }

        const filters = [
            "PASSAGEM AÉREA - SIGEPA",
            "PASSAGEM AÉREA - RPA"
        ]

        const OFFSET = query.itens * query.pagina

        const data = await database`
            SELECT id,
            "nomeParlamentar" as deputado,
            mes,
            ano,
            "dataEmissao",
            fornecedor AS companhia,
            "cnpjCPF" AS cnpj,
            REGEXP_REPLACE(numero, '[^0-9]', '', 'g') AS bilhete,
            "valorLiquido" AS valor,
            passageiro AS passageiros,
            trecho,
            "idDocumento",
            "urlDocumento" AS comprovante 
            FROM "Despesas" 
            WHERE "numeroDeputadoID" = ${params.id} 
            AND ano = ${query.ano} 
            AND mes = ${query.mes}
            ${query.fornecedor && isNaN(query.fornecedor) ? database`AND fornecedor = ${query.fornecedor}` : database``}
            ${query.fornecedor && !isNaN(query.fornecedor) ? database`AND "cnpjCPF" = ${query.fornecedor}` : database``}
            AND "descricao" IN ${database(filters)} 
            LIMIT ${query.itens}
            ${query.pagina > 1 ? database`OFFSET ${OFFSET}` : database``}
        `

        const counts = await database`
            SELECT
            fornecedor, COUNT(*) AS contratacoes, SUM("valorLiquido") AS "valorGasto", "cnpjCPF" as cnpj
            FROM "Despesas"
            WHERE "numeroDeputadoID" = ${params.id}
            AND "numeroSubCota" IN(${998}, ${999})
            AND "numeroEspecificacaoSubCota" = ${0}
            AND mes = ${query.mes}
            AND ano = ${query.ano}
            GROUP BY fornecedor, cnpj
        `

        return {
            total: data.length,
            data: {
                viagens: data,
                fornecedores: counts
            }
        }
    })

    app.get("/:id/locacoes/:tipo", {
        schema: schemas.DEPUTADO_LOCACOES
    }, async (req, res) => {
        const { params, query } = getUrlData(req, res, LOCATIONS_NUMBER)

        if(res.sent) {
            return;
        }
        
        const filter = LOCATIONS[params.tipo]

        if(!filter) {
            return res.status(400).send({
                error: `Tipo de locação inválido. Tipos disponíveis: ${Object.keys(LOCATIONS).join(", ")}`
            })
        }

        const OFFSET = query.itens * query.pagina

        const data = await database`
            SELECT id, 
            "nomeParlamentar" AS parlamentar,
            fornecedor,
            "cnpjCPF" as cnpj,
            "valorLiquido" AS valor,
            "dataEmissao" AS data,
            mes,
            ano,
            "idDocumento",
            "urlDocumento" FROM "Despesas"
            WHERE "numeroDeputadoID" = ${params.id}
            AND "numeroSubCota" = ${filter[0]}
            AND "numeroEspecificacaoSubCota" = ${filter[1]}
            AND mes = ${query.mes}
            AND ano = ${query.ano}
            ${query.fornecedor && isNaN(query.fornecedor) ? database`AND fornecedor = ${query.fornecedor}` : database``}
            ${query.fornecedor && !isNaN(query.fornecedor) ? database`AND "cnpjCPF" = ${query.fornecedor}` : database``}
            LIMIT ${query.itens}
            ${query.pagina > 1 ? database`OFFSET ${OFFSET}` : database``}
        `

        const counts = await getCounts(params, query, filter)

        return {
            total: data.length,
            data: {
                locacoes: data,
                fornecedores: counts
            }
        }
    })

    app.get("/:id/locomocao", {
        schema: schemas.DEPUTADO_LOCOMOCAO
    }, async (req, res) => {
        const { params, query } = getUrlData(req, res, LOCATIONS_NUMBER)

        if(res.sent) {
            return;
        }

        const OFFSET = query.itens * query.pagina

        const data = await database`
            SELECT
            id,
            "nomeParlamentar" AS parlamentar,
            fornecedor,
            "cnpjCPF" as cnpj,
            "valorLiquido" AS valor,
            "dataEmissao" AS data,
            mes,
            ano,
            "idDocumento",
            "urlDocumento" FROM "Despesas"
            WHERE "numeroDeputadoID" = ${params.id}
            AND "numeroSubCota" = ${122}
            AND "numeroEspecificacaoSubCota" = ${0}
            AND mes = ${query.mes}
            AND ano = ${query.ano}
            ${query.fornecedor && isNaN(query.fornecedor) ? database`AND fornecedor = ${query.fornecedor}` : database``}
            ${query.fornecedor && !isNaN(query.fornecedor) ? database`AND "cnpjCPF" = ${query.fornecedor}` : database``}
            LIMIT ${query.itens}
            ${query.pagina > 1 ? database`OFFSET ${OFFSET}` : database``}
        `

        const counts = await getCounts(params, query, [122, 0])

        return {
            total: data.length,
            data: {
                locomocao: data,
                fornecedores: counts
            }
        }
    })

    app.get("/:id/combustiveis/:tipo", {
        schema: schemas.DEPUTADO_COMBUSTIVEIS
    }, async (req, res) => {
        const { params, query } = getUrlData(req, res, FUELS_NUMBER)

        if(res.sent) {
            return;
        }
        
        const filter = FUELS_FILTERS[params.tipo]

        if(!filter) {
            return res.status(400).send({
                error: `Tipo de locação inválido. Tipos disponíveis: ${Object.keys(FUELS_FILTERS).join(", ")}`
            })
        }

        const OFFSET = query.itens * query.pagina

        const data = await database`
            SELECT id,
            "nomeParlamentar" AS parlamentar,
            fornecedor,
            "cnpjCPF" as cnpj,
            "valorLiquido" AS valor,
            "dataEmissao" AS data,
            mes,
            ano,
            "idDocumento",
            "urlDocumento"
            FROM "Despesas"
            WHERE "numeroDeputadoID" = ${params.id}
            AND "numeroSubCota" = ${filter[0]}
            AND "numeroEspecificacaoSubCota" = ${filter[1]}
            AND mes = ${query.mes}
            AND ano = ${query.ano}
            ${query.fornecedor && isNaN(query.fornecedor) ? database`AND fornecedor = ${query.fornecedor}` : database``}
            ${query.fornecedor && !isNaN(query.fornecedor) ? database`AND "cnpjCPF" = ${query.fornecedor}` : database``}
            LIMIT ${query.itens}
            ${query.pagina > 1 ? database`OFFSET ${OFFSET}` : database``}
        `

        const counts = await getCounts(params, query, filter)

        return {
            total: data.length,
            data: {
                combustiveis: data,
                fornecedores: counts
            }
        }
    })

    app.get("/:id/alimentacao", {
        schema: schemas.DEPUTADO_ALIMENTACAO
    }, async (req, res) => {
        const { params, query } = getUrlData(req, res, ALIMENTATIONS_NUMBER)

        if(res.sent) {
            return;
        }

        const OFFSET = query.itens * query.pagina

        const data = await database`
            SELECT id, 
            "nomeParlamentar" AS parlamentar,
            fornecedor,
            "cnpjCPF" as cnpj,
            "valorLiquido" AS valor,
            "dataEmissao" AS data,
            mes,
            ano,
            "idDocumento",
            "urlDocumento"
            FROM "Despesas"
            WHERE "numeroDeputadoID" = ${params.id}
            AND "numeroSubCota" = ${13}
            AND "numeroEspecificacaoSubCota" = ${0}
            AND mes = ${query.mes}
            AND ano = ${query.ano}
            ${query.fornecedor && isNaN(query.fornecedor) ? database`AND fornecedor = ${query.fornecedor}` : database``}
            ${query.fornecedor && !isNaN(query.fornecedor) ? database`AND "cnpjCPF" = ${query.fornecedor}` : database``}
            LIMIT ${query.itens}
            ${query.pagina > 1 ? database`OFFSET ${OFFSET}` : database``}
        `

        const counts = await getCounts(params, query, ALIMENTATIONS_FILTER)

        return {
            total: data.length,
            data: {
                alimentacao: data,
                fornecedores: counts
            }
        }
    })

}

export const route_config = {
    prefix: "/relatorios"
}