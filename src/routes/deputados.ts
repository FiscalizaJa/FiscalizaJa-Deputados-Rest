import { FastifyInstance } from "fastify";
import UseDatabase from "../structures/Database";
import { prepareDatabase } from "../structures/Database";
import schemas from "../schemas/routes";

const database = UseDatabase()

function selectDefaultMonths() {
    const start = new Date().getMonth() + 1

    let current = start

    const months = []

    while (current >= start - 6) {
        months.push(current)
        current -= 1
    }

    return months
}

function filterDeputiesQueries(query): any {
    const keys = Object.keys(query)

    for(const key of keys) {
        let value = query[key]

        if(!value) {
            continue;
        }

        if(!Array.isArray(value)) {
            if(isNaN(value)) {
                return {
                    invalid: true,
                    query: key
                }
            }

            value = [value]
            query[key] = value
        } else {
            if(value.length > 15) {
                return {
                    invalid: true,
                    query: key
                }
            } else {
                value = value.filter(v => !isNaN(v))
                query[key] = value
            }
        }
    }

    return { query: query }
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

            let query = filterDeputiesQueries(req.query)

            if(query.invalid) {
                return res.status(400).send({
                    error: `Query inválida: \"${query.query}\"`
                })
            } else {
                query = query.query
            }

            if(query.pagina) {
                query.pagina = query.pagina[0]
            }

            if(query.itens) {
                query.itens = query.itens[0]
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
    
            const data = await database`SELECT ${database(expenses_columns)} FROM "Despesas" WHERE "numeroDeputadoID" = ${params.id} ${query.ano ? database`AND ano IN ${database(query.ano as any)}` : database``} ${query.mes ? database`AND mes IN ${database(query.mes as any)}` : database``} ${query.fornecedor ? database`AND "cnpjCPF" IN ${database(query.fornecedor)}` : database``} LIMIT ${expenses_number} ${query.pagina > 1 ? database`OFFSET ${OFFSET}` : database``}`

            return {
                total: data.length,
                data: data
            }
        })

        resolve(true)
    })

}

export const route_config = {
    prefix: "/api/deputados"
}