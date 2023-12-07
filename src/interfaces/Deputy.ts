interface Deputy {
    id?: string,
    uri: string,
    operational?: number,
    nome: string,
    siglaPartido?: number,
    urlFoto: string,
    idCamara: number,
    idLegislaturaInicial: number,
    idLegislaturaFinal: number,
    nomeCivil: string,
    siglaSexo: string,
    urlRedeSocial: string[],
    urlWebsite: string[],
    dataNascimento: string,
    dataFalecimento: string,
    ufNascimento: string,
    municipioNascimento: string
}

export type {
    Deputy
}