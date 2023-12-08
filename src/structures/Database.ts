import postgres from "postgres";
import dotenv from "dotenv";

dotenv.config()

const sql = postgres(process.env.DATABASE_URL, {
    transform: {
        undefined: null
    }
})

async function prepareDatabase(useIndex: boolean = false) {
    await sql`
    CREATE TABLE IF NOT EXISTS "Deputados" (
        "idCamara" INTEGER PRIMARY KEY,
        "uri" TEXT NOT NULL,
        "operational" INTEGER,
        "nome" TEXT NOT NULL,
        "urlFoto" TEXT NOT NULL,
        "idLegislaturaInicial" INTEGER NOT NULL,
        "idLegislaturaFinal" INTEGER NOT NULL,
        "nomeCivil" TEXT NOT NULL,
        "siglaSexo" TEXT NOT NULL,
        "siglaPartido" TEXT,
        "urlRedeSocial" TEXT[],
        "urlWebsite" TEXT[],
        "dataNascimento" TEXT,
        "dataFalecimento" TEXT,
        "ufNascimento" TEXT NOT NULL,
        "municipioNascimento" TEXT NOT NULL
    );
    `
    await sql `
    CREATE TABLE IF NOT EXISTS "Despesas" (
        id SERIAL PRIMARY KEY,
        "difId" TEXT UNIQUE,
        operational INTEGER,
        "nomeParlamentar" TEXT,
        cpf TEXT,
        "numeroCarteiraParlamentar" TEXT,
        legislatura INTEGER,
        "siglaUF" TEXT,
        "siglaPartido" TEXT,
        "codigoLegislatura" INTEGER,
        "numeroSubCota" INTEGER,
        descricao TEXT,
        "numeroEspecificacaoSubCota" INTEGER,
        "descricaoEspecificacao" TEXT,
        fornecedor TEXT,
        "cnpjCPF" TEXT,
        numero TEXT,
        "tipoDocumento" TEXT,
        "dataEmissao" TEXT,
        "valorDocumento" DECIMAL(10,2),
        "valorGlosa" DECIMAL(10,2),
        "valorLiquido" DECIMAL(10,2),
        mes INTEGER,
        ano INTEGER,
        parcela INTEGER,
        passageiro TEXT,
        trecho TEXT,
        lote TEXT,
        ressarcimento TEXT,
        "datPagamentoRestituicao" TEXT,
        restituicao TEXT,
        "numeroDeputadoID" INTEGER,
        "idDocumento" INTEGER,
        "urlDocumento" TEXT
    );
    `

    await sql`
        CREATE TABLE IF NOT EXISTS "Aeroportos" (
            id SERIAL PRIMARY KEY,
            icao VARCHAR(4),
            iata VARCHAR(3),
            name VARCHAR(100),
            city VARCHAR(50),
            state VARCHAR(50),
            elevation NUMERIC,
            lat NUMERIC,
            lon NUMERIC,
            tz VARCHAR(50),
            uf VARCHAR(2)
        )
    `

    if(useIndex === true) {
        await sql`
            CREATE INDEX IF NOT EXISTS idx_despesafiltros ON "Despesas" ("numeroDeputadoID", "mes", "ano", "idDocumento", "difId", "descricao", "numeroSubCota", "numeroEspecificacaoSubCota", "siglaPartido", "cnpjCPF", "fornecedor");
        `
        await sql`
            CREATE INDEX IF NOT EXISTS idx_deputadoFiltros ON "Deputados" ("siglaSexo");
        `
        await sql`
            CREATE INDEX IF NOT EXISTS idx_aeroportoFiltros ON "Aeroportos" (icao, iata, uf)
        `
    }
}

export {
    prepareDatabase
}

export default function UseDatabase() {
    return sql
}