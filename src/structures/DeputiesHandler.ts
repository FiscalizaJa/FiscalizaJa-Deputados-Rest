import UseDatabase from "./Database";

import type { Sql } from "postgres";
import type { Deputy } from "../interfaces/Deputy";

class DeputiesHandler {
    public database: Sql

    static DEPUTIES_PER_PAGE = 513;
    static deputies_columns = ["idCamara", "uri", "nome", "urlFoto", "operational", "idLegislaturaInicial", "idLegislaturaFinal", "nomeCivil", "siglaSexo", "siglaPartido", "urlRedeSocial", "urlWebsite", "dataNascimento", "dataFalecimento", "ufNascimento", "municipioNascimento"]

    constructor(database?: Sql) {
        this.database = database ? database : UseDatabase() // ability to specify a connection, or use the global connection
    }

    public async getDeputies(query: { itens?: number, pagina: number }): Promise<Deputy[]> {
        const OFFSET = query.pagina * query.itens

        const data: Deputy[] = await this.database`
            SELECT ${this.database(DeputiesHandler.deputies_columns)} from "Deputados" 
            WHERE operational = 1 
            LIMIT ${query.itens} 
            ${query.pagina > 1 ? this.database`OFFSET ${OFFSET}` : this.database``}
        `
        
        return data
    }

    public async getDeputy(idCamara: number): Promise<Deputy | null> {
        const data: Deputy[] = await this.database`
            SELECT ${this.database(DeputiesHandler.deputies_columns)} 
            FROM "Deputados" 
            WHERE "idCamara" = ${idCamara} LIMIT 1
        `
        return data[0] || null
    }
}

export default DeputiesHandler