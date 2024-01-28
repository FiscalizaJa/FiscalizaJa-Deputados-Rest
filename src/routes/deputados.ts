import { FastifyInstance } from "fastify";
import UseDatabase from "../structures/Database";
import ExpensesHandler from "../structures/ExpensesHandler";
import DeputiesHandler from "../structures/DeputiesHandler";
import DeputyBanners from "../structures/DeputyBanners";
import schemas from "../schemas/routes";

const database = UseDatabase()

const expenses = new ExpensesHandler(database)
const deputies = new DeputiesHandler(database)

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

export default async function load(app: FastifyInstance) {
    return new Promise(async (resolve, reject) => {
    
        app.get("/", {
            schema: schemas.DEPUTADOS
        }, async (req, res) => {
            const query = req.query as {
                itens: number,
                pagina: number
            }

            query.itens = Math.min(DEPUTIES_PER_PAGE, query.itens || DEPUTIES_PER_PAGE)

            if(!query.pagina || query.pagina == 0 || isNaN(query.pagina)) {
                query.pagina = 1
            }

            const data = await deputies.getDeputies(query)

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

            DeputyBanners.LookupDeputyImage(params.id) // generate on-demand

            const data = await deputies.getDeputy(params.id)

            return {
                data: data
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

            const nomes = query.fornecedor?.filter(f => isNaN(f as any)) || null
            const cnpjs = query.fornecedor?.filter(f => !isNaN(f as any)) || null

            const data = await expenses.getAllExpenses(params.id, query, nomes, cnpjs)
            const gasto = await expenses.getTotalGasto(params.id, query, nomes, cnpjs)
            const fornecedores = await expenses.getFornecedores(params.id, query)

            return {
                total: data.length,
                totalGasto: gasto,
                fornecedores: fornecedores,
                data: data
            }
        })

        app.get("/:id/despesas/resumo", {
            schema: schemas.DEPUTADO_DESPESAS_RESUMO
        }, async (req, res) => {
            const params: { id?: number } = req.params

            if(isNaN(params.id)) {
                return res.status(400).send({
                    error: "Invalid ID"
                })
            }

            let query = req.query as {
                ano: number
                mes: number
                fornecedor: string[]
            }

            const date = new Date()
            const currentYear = date.getFullYear()

            if(!query.ano || query.ano > currentYear) {
                query.ano = currentYear
            }

            if(!query.mes || query.mes > 12) {
                query.mes = date.getMonth() + 1
            }

            const resumo = await expenses.getGastosCategorias(params.id, query)
            const gastoPorMes = await expenses.getGastosPorMes(params.id, query.ano, query.fornecedor || null)

            return {
                data: {
                    categorias: resumo,
                    gastoPorMes: gastoPorMes
                }
            }
        })

        resolve(true)
    })

}

export const route_config = {
    prefix: "/deputados"
}