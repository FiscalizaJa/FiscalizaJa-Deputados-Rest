import cron from "node-cron";
import Colors from "colors";
import config from "../../config.json";

import startSaveProcess from "../dataProcessors/expenses";

import UseDatabase from "../structures/Database";

const database = UseDatabase()

const job = cron.schedule(config.cronjobs.update_expenses, async () => {
    console.log(Colors.green(`Running update expeses job.`))
    await startSaveProcess(true) // true = save only for current year
    console.log(Colors.yellow("Removing duplicates"))
    await database`
        WITH cte AS (
            SELECT id, "urlDocumento",
                ROW_NUMBER() OVER (PARTITION BY "urlDocumento" ORDER BY id DESC) AS rn
            FROM "Despesas"
            WHERE "urlDocumento" IS NOT NULL AND "urlDocumento" != ''
        )
        DELETE FROM "Despesas"
        WHERE id IN (SELECT id FROM cte WHERE rn > 1)
    `
    console.log(Colors.green("Finished."))
    
}, {
    runOnInit: false,
    timezone: "America/Sao_Paulo"
})

export default job