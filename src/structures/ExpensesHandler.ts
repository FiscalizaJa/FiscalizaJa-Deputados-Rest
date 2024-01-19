import UseDatabase from "./Database";

import type { Sql } from "postgres";
import type { Deputy } from "../interfaces/Deputy";

class ExpensesHandler {
    public database: Sql

    static expenses_columns = ['id', 'nomeParlamentar', 'cpf', 'numeroCarteiraParlamentar', 'legislatura', 'siglaUF', 'siglaPartido', 'codigoLegislatura', 'numeroSubCota', 'descricao', 'numeroEspecificacaoSubCota', 'descricaoEspecificacao', 'fornecedor', 'cnpjCPF', 'numero', 'tipoDocumento', 'dataEmissao', 'valorDocumento', 'valorGlosa', 'valorLiquido', 'mes', 'ano', 'parcela', 'passageiro', 'trecho', 'lote', 'ressarcimento', 'datPagamentoRestituicao', 'restituicao', 'numeroDeputadoID', 'idDocumento', 'urlDocumento']
    static EXPENSES_PER_PAGE = 150;

    constructor(database?: Sql) {
        this.database = database ? database : UseDatabase() // ability to specify a connection, or use the global connection
    }

    public async getAllExpenses(
        idCamara: number,
        query: {
            pagina: number,
            ano: number[]
            mes: number[]
            itens: number
            fornecedor: string[]
        },
        nomes?: string[],
        cnpjs?: string[]
    ) {
        const expenses_number = Math.min(query.itens || ExpensesHandler.EXPENSES_PER_PAGE, ExpensesHandler.EXPENSES_PER_PAGE)
        const OFFSET = (query.pagina || 1) * expenses_number

        nomes = nomes ? nomes : query.fornecedor?.filter(f => isNaN(f as any)) || null
        cnpjs = cnpjs ? cnpjs : query.fornecedor?.filter(f => !isNaN(f as any)) || null

        const data = await this.database`
            SELECT ${this.database(ExpensesHandler.expenses_columns)} FROM "Despesas"
            WHERE "numeroDeputadoID" = ${idCamara}
            ${query.ano ? this.database`AND ano IN ${this.database(query.ano as any)}` : this.database``}
            ${query.mes ? this.database`AND mes IN ${this.database(query.mes as any)}` : this.database``}
            ${query.fornecedor ?
                this.database`
                    AND
                    (${query.fornecedor ? this.database`"cnpjCPF" IN ${this.database(cnpjs)}` : this.database``}
                    ${query.fornecedor ? cnpjs ? this.database`OR fornecedor IN ${this.database(nomes)}` : this.database`fornecedor IN ${this.database(query.fornecedor)}` : this.database``})
                `
                : this.database``
            }
            LIMIT ${expenses_number}
            ${query.pagina > 1 ? this.database`OFFSET ${OFFSET}` : this.database``}
        `

        return data
    }

    public async getTotalGasto(
        idCamara: number,
        query: {
            pagina: number,
            ano: number[]
            mes: number[]
            itens: number
            fornecedor: string[]
        },
        nomes?: string[],
        cnpjs?: string[]
    ) {
        nomes = nomes ? nomes : query.fornecedor?.filter(f => isNaN(f as any)) || null
        cnpjs = cnpjs ? cnpjs : query.fornecedor?.filter(f => !isNaN(f as any)) || null

        const data = await this.database`
            SELECT SUM("valorLiquido") as "valorTotal" FROM "Despesas"
            WHERE "numeroDeputadoID" = ${idCamara}
            ${query.ano ? this.database`AND ano IN ${this.database(query.ano as any)}` : this.database``}
            ${query.mes ? this.database`AND mes IN ${this.database(query.mes as any)}` : this.database``}
            ${query.fornecedor ?
                this.database`
                    AND
                    (${query.fornecedor ? this.database`"cnpjCPF" IN ${this.database(cnpjs)}` : this.database``}
                    ${query.fornecedor ? cnpjs ? this.database`OR fornecedor IN ${this.database(nomes)}` : this.database`fornecedor IN ${this.database(query.fornecedor)}` : this.database``})
                `
                : this.database``
            }
        `

        return data[0]?.valorTotal || 0
    }

    public async getFornecedores(idCamara: number, query: { mes: number[], ano: number[] }) {
        const data = await this.database`
            SELECT fornecedor, COUNT(*) AS contratacoes, SUM("valorLiquido") AS "valorGasto", "cnpjCPF" as cnpj
            FROM "Despesas"
            WHERE "numeroDeputadoID" = ${idCamara}
            AND mes IN ${this.database(query.mes)}
            AND ano IN ${this.database(query.ano)}
            GROUP BY fornecedor, cnpj
        `

        return data
    }

    public async getGastosRelatorio(idCamara: number, query: { mes: number, ano: number }, filter: number[]) {
        const data = await this.database`
            SELECT fornecedor, COUNT(*) AS contratacoes, SUM("valorLiquido") AS "valorGasto", "cnpjCPF" as cnpj
            FROM "Despesas"
            WHERE "numeroDeputadoID" = ${idCamara}
            AND "numeroSubCota" = ${filter[0]}
            AND "numeroEspecificacaoSubCota" = ${filter[1]}
            AND mes = ${query.mes}
            AND ano = ${query.ano}
            GROUP BY fornecedor, cnpj
        `

        return data
    }

    public async getViagens(
        idCamara: number,
        query: {
            ano: number,
            mes: number,
            pagina: number,
            itens: number,
            fornecedor: string | number
        }
    ) {
        const filters = [
            "PASSAGEM AÉREA - SIGEPA",
            "PASSAGEM AÉREA - RPA"
        ]

        const OFFSET = query.itens * query.pagina

        const data = await this.database`
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
            WHERE "numeroDeputadoID" = ${idCamara} 
            AND ano = ${query.ano} 
            AND mes = ${query.mes}
            ${query.fornecedor && isNaN(Number(query.fornecedor)) ? this.database`AND fornecedor = ${query.fornecedor}` : this.database``}
            ${query.fornecedor && !isNaN(Number(query.fornecedor)) ? this.database`AND "cnpjCPF" = ${query.fornecedor}` : this.database``}
            AND "descricao" IN ${this.database(filters)} 
            LIMIT ${query.itens}
            ${query.pagina > 1 ? this.database`OFFSET ${OFFSET}` : this.database``}
        `

        return data
    }

    public async getRelatorio(
        idCamara: number,
        query: {
            ano: number,
            mes: number,
            pagina: number,
            itens: number,
            fornecedor: string | number
        },
        filter: number[]
        ) {
            const OFFSET = query.itens * query.pagina

            const data = await this.database`
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
                WHERE "numeroDeputadoID" = ${idCamara}
                AND "numeroSubCota" = ${filter[0]}
                AND "numeroEspecificacaoSubCota" = ${filter[1]}
                AND mes = ${query.mes}
                AND ano = ${query.ano}
                ${query.fornecedor && isNaN(Number(query.fornecedor)) ? this.database`AND fornecedor = ${query.fornecedor}` : this.database``}
                ${query.fornecedor && !isNaN(Number(query.fornecedor)) ? this.database`AND "cnpjCPF" = ${query.fornecedor}` : this.database``}
                LIMIT ${query.itens}
                ${query.pagina > 1 ? this.database`OFFSET ${OFFSET}` : this.database``}
            `

            return data
    }
}

export default ExpensesHandler