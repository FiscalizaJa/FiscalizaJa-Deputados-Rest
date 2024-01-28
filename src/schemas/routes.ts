export default {
    AEROPORTOS: {
        description: `Consulta aeroportos em nossa base de dados por vários códigos IATA.`,
        tags: ["Aeroportos"],
        summary: "Consulta códigos IATA de aeroportos",
        querystring: {
            type: "object",
            properties: {
                iata: {
                    type: "array",
                    description: "Códigos IATAS a serem consultados. Pode ser mais de um.",
                    items: {
                        type: "string"
                    }
                }
            }
        }
    },

    DEPUTADOS: {
        description: "Retorna todos os deputados que estão em exercício na câmara dos deputados.",
        summary: "Todos os deputados em exercício",
        tags: ["Deputados"],
        
        querystring: {
            type: "object",
            properties: {
                itens: {
                    type: "number",
                    description: `Número de itens retornado por página.`
                },
                pagina: {
                    type: "number",
                    description: "Página dos resultados."
                }
            }
        }
    },

    DEPUTADO: {
        description: "Retorna informações de um deputado específico.",
        summary: "Informações de um deputado.",
        tags: ["Deputados"],

        params: {
            type: "object",
            properties: {
                id: {
                    type: "number",
                    description: "ID do deputado a ser consultado."
                }
            }
        }
    },

    DEPUTADO_DESPESAS: {
        description: "Lista com todas as despesas de um deputado usando a cota parlamentar.",
        summary: "Todas as despesas do deputado",
        tags: ["Deputados"],

        params: {
            type: "object",
            properties: {
                id: {
                    type: "number",
                    description: "ID do deputado a ser consultado."
                }
            }
        },

        querystring: {
            type: "object",
            properties: {
                itens: {
                    type: "number",
                    description: `Número de despesas retornadas por página.`
                },
                pagina: {
                    type: "number",
                    description: "Página dos resultados."
                },
                ano: {
                    type: "array",
                    description: "Um ou mais anos em que ocorreram as despesas.",
                    items: {
                        type: "number"
                    }
                },
                mes: {
                    type: "array",
                    description: "Número de um ou mais meses em que ocorreram as despesas.",
                    items: {
                        type: "number"
                    }
                },
                fornecedor: {
                    type: "array",
                    description: "Um ou mais fornecedores das despesas.",
                    items: {
                        type: "string"
                    }
                }
            }
        }
    },

    DEPUTADO_DESPESAS_RESUMO: {
        description: "Retorna um resumo dos gastos de um determinado deputado. Retorna o total por categoria e mensal.",
        summary: "Resumo das despesas do deputado.",

        tags: ["Deputados"],

        params: {
            type: "object",
            properties: {
                id: {
                    type: "number",
                    description: "ID do deputado a ser consultado."
                }
            }
        },

        querystring: {
            type: "object",
            properties: {
                ano: {
                    type: "array",
                    description: "Um ou mais anos em que ocorreram as despesas.",
                    items: {
                        type: "number"
                    }
                },
                mes: {
                    type: "array",
                    description: "Número de um ou mais meses em que ocorreram as despesas.",
                    items: {
                        type: "number"
                    }
                },
                fornecedor: {
                    type: "array",
                    description: "Um ou mais fornecedores das despesas.",
                    items: {
                        type: "string"
                    }
                }
            }
        }
    },

    FORNECEDORES: {
        description: `Consulta o valor total gasto pela câmara com um fornecedor em todos os anos 2009 a ${new Date().getFullYear()}`,
        summary: "Valor gasto pela câmara com um fornecedor em todos os anos.",
        tags: ["Fornecedores"],

        params: {
            type: "object",
            properties: {
                cnpj: {
                    type: "string",
                    description: "CNPJ ou CPF do fornecedor."
                }
            }
        },

        querystring: {
            type: "object",
            properties: {
                idDeputado: {
                    type: "number",
                    description: "ID de um deputado para consultar os gastos específicos dele."
                },
                itens: {
                    type: "number",
                    description: `Número de despesas retornadas por página.`
                },
                pagina: {
                    type: "number",
                    description: "Página dos resultados."
                },
            }
        }
    },

    PARTIDOS: {
        description: "Obtém todos os partidos de deputados na câmara.",
        summary: "Todos os partidos.",
        tags: ["Partidos"]
    },

    DEPUTADO_VIAGENS: {
        description: "Todas as viagens de um deputado pagas com a cota parlamentar.",
        summary: "Viagens do deputado",
        tags: ["Relatórios"],

        params: {
            type: "object",
            properties: {
                id: {
                    type: "string"
                }
            }
        },

        querystring: {
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
    },

    DEPUTADO_LOCACOES: {
        description: "Locações do deputado, separados pelos tipos: veiculos, aeronaves e embarcações.",
        summary: "Locações do deputado.",
        tags: ["Relatórios"],

        params: {
            type: "object",
            properties: {
                id: {
                    type: "number",
                    description: "ID do deputado a ser consultado."
                },
                tipo: {
                    type: "string",
                    description: "Tipo de locação a ser consultada."
                }
            }
        },

        querystring: {
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
    },

    DEPUTADO_LOCOMOCAO: {
        descripion: "Gastos do deputado com locomoção. Inclui serviços de táxi, pedágio e estacionamento.",
        summary: "Gastos do deputado com locomoção.",
        tags: ["Relatórios"],

        params: {
            type: "object",
            properties: {
                id: {
                    type: "string"
                }
            }
        },

        querystring: {
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
    },
    
    DEPUTADO_COMBUSTIVEIS: {
        description: "Gastos do deputado com combustíveis, separados por aeronaves, veículos e embarcações.",
        summary: "Gastos do deputado com combustíveis.",
        tags: ["Relatórios"],

        params: {
            type: "object",
            properties: {
                id: {
                    type: "number",
                    description: "ID do deputado a ser consultado."
                },
                tipo: {
                    type: "string",
                    description: "Tipo combustível a ser consultadp."
                }
            }
        },

        querystring: {
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
    },

    DEPUTADO_ALIMENTACAO: {
        descripion: "Gastos do deputado com alimentação.",
        summary: "Gastos do deputado com alimentação.",
        tags: ["Relatórios"],

        params: {
            type: "object",
            properties: {
                id: {
                    type: "string"
                }
            }
        },

        querystring: {
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
    },
}