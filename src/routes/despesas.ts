import { FastifyInstance } from "fastify";
import ExpensesHandler from "../structures/ExpensesHandler";
import UseDatabase from "../structures/Database";

const database = UseDatabase()

const expenses = new ExpensesHandler(database)

export default async function load(app: FastifyInstance) {

    app.get("/:id", async (req, res) => {
        const params = req.params as { id: number }

        const expense = await expenses.getSpecificExpense(params.id)

        return {
            data: expense
        }
    })

}

export const route_config = {
    prefix: "/despesas"
}