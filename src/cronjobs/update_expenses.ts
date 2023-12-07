import cron from "node-cron";
import Colors from "colors";
import config from "../../config.json";

import startSaveProcess from "../dataProcessors/expenses";

const job = cron.schedule(config.cronjobs.update_expenses, async () => {
    console.log(Colors.green(`Running update expeses job.`))
    await startSaveProcess(true) // true = save only for current year
}, {
    runOnInit: false,
    timezone: "America/Sao_Paulo"
})

export default job