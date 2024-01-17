import { FastifyInstance } from "fastify";
import UseDatabase from "../structures/Database";
import schemas from "../schemas/routes";

const database = UseDatabase()

function selectDefaultMonths() {
    const date = new Date()
    const start = 12

    let current = start

    const months = []

    while (current >= start) {
        months.push(current)
        current -= 1
    }

    return months
}

const DEPUTIES_PER_PAGE = 513;
const EXPENSES_PER_PAGE = 150;

const deputies_columns = ["idCamara", "uri", "nome", "urlFoto", "idLegislaturaInicial", "idLegislaturaFinal", "nomeCivil", "siglaSexo", "siglaPartido", "urlRedeSocial", "urlWebsite", "dataNascimento", "dataFalecimento", "ufNascimento", "municipioNascimento"]
const expenses_columns = ['id', 'nomeParlamentar', 'cpf', 'numeroCarteiraParlamentar', 'legislatura', 'siglaUF', 'siglaPartido', 'codigoLegislatura', 'numeroSubCota', 'descricao', 'numeroEspecificacaoSubCota', 'descricaoEspecificacao', 'fornecedor', 'cnpjCPF', 'numero', 'tipoDocumento', 'dataEmissao', 'valorDocumento', 'valorGlosa', 'valorLiquido', 'mes', 'ano', 'parcela', 'passageiro', 'trecho', 'lote', 'ressarcimento', 'datPagamentoRestituicao', 'restituicao', 'numeroDeputadoID', 'idDocumento', 'urlDocumento']

export default async function load(app: FastifyInstance) {
    return new Promise(async (resolve, reject) => {
    
        app.get("/", {
            schema: schemas.DEPUTADOS
        }, async (req, res) => {
            const query: {
                itens?: number,
                pagina?: number
            } = req.query as any

            query.itens = Math.min(DEPUTIES_PER_PAGE, query.itens || DEPUTIES_PER_PAGE)

            if(!query.pagina || query.pagina == 0 || isNaN(query.pagina)) {
                query.pagina = 1
            }

            const OFFSET = query.pagina * query.itens

            const data = await database`SELECT ${database(deputies_columns)} from "Deputados" ${database`WHERE operational = 1`} ${database`LIMIT ${query.itens}`} ${query.pagina > 1 ? database`OFFSET ${OFFSET}` : database``}`

            return {
                total: data.length,
                data: data
            }

        })

        app.get("/:id", {
            schema: schemas.DEPUTADO
        }, async (req, res) => {
            const params: { id?: number } = req.params

            if(isNaN(params.id)) {
                return res.status(400).send({
                    error: "Invalid ID"
                })
            }

            const data = await database`SELECT ${database(deputies_columns)} FROM "Deputados" ${database`WHERE "idCamara" = ${params.id}`} LIMIT 1`
            return {
                data: data[0] || null
            }
        })

        app.get("/:id/despesas", {
            schema: schemas.DEPUTADO_DESPESAS
        }, async (req, res) => {
            const params: { id?: number } = req.params

            if(isNaN(params.id)) {
                return res.status(400).send({
                    error: "Invalid ID"
                })
            }

            let query = req.query as {
                pagina: number,
                ano: number[]
                mes: number[]
                itens: number
                fornecedor: string[]
            }

            if(!query.ano) {
                query.ano = [new Date().getFullYear()]
            } else {
                query.ano = query.ano.filter(y => y <= new Date().getFullYear())
            }

            if(!query.mes) {
                query.mes = selectDefaultMonths()
            } else {
                query.mes = query.mes.filter(m => m <= 12)
            }

            if(query.ano.length > 15 || query.mes.length > 15 || query.fornecedor?.length > 15) {
                return res.status(400).send({
                    error: "É permitido no máximo 15 queries do mesmo filtro."
                })
            }

            if(!query.pagina || query.pagina == 0 || isNaN(query.pagina)) {
                query.pagina = 1
            }
            
            const expenses_number = Math.min(query.itens || EXPENSES_PER_PAGE, EXPENSES_PER_PAGE)

            const OFFSET = (query.pagina || 1) * expenses_number

            const nomes = query.fornecedor?.filter(f => isNaN(f as any)) || null
            const cnpjs = query.fornecedor?.filter(f => !isNaN(f as any)) || null

            const data = await database`
                SELECT ${database(expenses_columns)} FROM "Despesas"
                WHERE "numeroDeputadoID" = ${params.id}
                ${query.ano ? database`AND ano IN ${database(query.ano as any)}` : database``}
                ${query.mes ? database`AND mes IN ${database(query.mes as any)}` : database``}
                ${query.fornecedor ?
                    database`
                        AND
                        (${query.fornecedor ? database`"cnpjCPF" IN ${database(cnpjs)}` : database``}
                        ${query.fornecedor ? cnpjs ? database`OR fornecedor IN ${database(nomes)}` : database`fornecedor IN ${database(query.fornecedor)}` : database``})
                    `
                    : database``
                }
                LIMIT ${expenses_number}
                ${query.pagina > 1 ? database`OFFSET ${OFFSET}` : database``}
            `

            const gasto = await database`
                SELECT SUM("valorLiquido") as "valorTotal" FROM "Despesas"
                WHERE "numeroDeputadoID" = ${params.id}
                ${query.ano ? database`AND ano IN ${database(query.ano as any)}` : database``}
                ${query.mes ? database`AND mes IN ${database(query.mes as any)}` : database``}
                ${query.fornecedor ?
                    database`
                        AND
                        (${query.fornecedor ? database`"cnpjCPF" IN ${database(cnpjs)}` : database``}
                        ${query.fornecedor ? cnpjs ? database`OR fornecedor IN ${database(nomes)}` : database`fornecedor IN ${database(query.fornecedor)}` : database``})
                    `
                    : database``
                }
            `

            const fornecedores = await database`
                SELECT fornecedor, COUNT(*) AS contratacoes, SUM("valorLiquido") AS "valorGasto", "cnpjCPF" as cnpj
                FROM "Despesas"
                WHERE "numeroDeputadoID" = ${params.id}
                AND mes IN ${database(query.mes)}
                AND ano IN ${database(query.ano)}
                GROUP BY fornecedor, cnpj
            `

            return {
                total: data.length,
                totalGasto: gasto[0].valorTotal,
                fornecedores: fornecedores,
                data: data
            }
        })

        resolve(true)
    })

}

export const route_config = {
    prefix: "/deputados"
}