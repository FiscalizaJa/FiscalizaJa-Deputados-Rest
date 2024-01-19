import cron from "node-cron";
import Colors from "colors";
import fs from "fs/promises";

import config from "../../config.json";

const job = cron.schedule(config.cronjobs.clear_banners, async () => {
    console.log(Colors.green(`Running clear banners job.`))
    const files = await fs.readdir(`./api_images`)
    
    for(const file of files) {
        fs.unlink(`./api_images/${file}`)
    }
}, {
    runOnInit: false,
    timezone: "America/Sao_Paulo"
})

export default job