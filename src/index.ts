import fastify from "fastify";
import dotenv from "dotenv";
import Colors from "colors";
import Router from "./structures/Router";
import cors from "@fastify/cors";
import swagger from "@fastify/swagger";
import swaggerUI from "@fastify/swagger-ui";

import job from "./cronjobs/update_expenses";

dotenv.config()

const app = fastify()

declare global {
    var readyToServe: boolean
}

global.readyToServe = false

console.log(Colors.yellow("Starting..."))

app.addHook("preHandler", (req, res, done) => {
    if(global.readyToServe == false || !global.readyToServe) {
        return res.send({
            message: "O servidor não está preparado para receber requisições, tente novamente em alguns segundos."
        })
    } else {
        done()
    }
})

app.register(cors, {
    origin: "*",
    allowedHeaders: "*"
})
app.register(swagger, {
    openapi: {
        info: {
            title: "FiscalizaJá Deputados",
            description: `
                Uma forma diferente de fiscalizar.
                Seja bem-vindo a documentação do serviço REST do FiscalizaJá Deputados!\n
                Todos os dados são públicos e estão disponíveis 24 horas por dia aqui para você consultar.
                `,
            version: "1.0.0"
        },
        tags: [
            {
                name: "Aeroportos",
                description: "Endpoints relacionados a consulta de códigos IATA de aeroportos."
            },
            {
                name: "Deputados",
                description: "Endpoints relacionados a consulta de deputados federais."
            },
            {
                name: "Fornecedores",
                description: "Endpoints relacionados a consulta de fornecedores informados nas despesas."
            },
            {
                name: "Partidos",
                description: "Endpoints relacionados a consulta de partidos."
            },
            {
                name: "Relatórios",
                description: "Endpoints relacionados a consultas de relatórios de despesas de deputados."
            }
        ]
    }
})

app.register(swaggerUI, {
    routePrefix: "/docs",
    staticCSP: true
})

Router.startRouter(app).then(() => {
    const port = Number(process.env.PORT) || 3000

    app.listen({
        host: "0.0.0.0",
        port: port
    }).then(async () => {
        console.log(Colors.green(`Ready to serve data on port ${port}`))
        job.start()
    })
})