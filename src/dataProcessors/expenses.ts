import jsonstream from "JSONStream";
import Downloader from "../structures/Downloader";
import fs from "fs";
import Colors from "colors";
import UseDatabase from "../structures/Database";
import { prepareDatabase } from "../structures/Database";
import config from "../../config.json";

import { Expense } from "../interfaces/Expense";

import paginate from "../paginate";

const downloader = new Downloader()

const database = UseDatabase()

function createYears(start: number, end: number) {
    let current = start
    const years = []

    while(current < end) {
        current += 1
        years.push(current)
    }

    return years
}

async function checkJson(updateMode: boolean = false) {
    const years = updateMode ? [new Date().getFullYear()] : createYears(2008, new Date().getFullYear())

    let promises = []

    for(const year of years) {
        if(promises.length >= 3) {
            await Promise.all(promises)
            promises = []
        }

        promises.push(new Promise(async (resolve, reject) => {
            if(fs.existsSync(`./data/Ano-${year}.json`)) {
                console.log(Colors.red(`${year} is outdated, removing...`))
                fs.unlinkSync(`./data/Ano-${year}.json`)
            }

            console.log(Colors.yellow(`Downloading deputies expenses from year ${year}`))
            const download = await downloader.download_expenses(year)
            console.log(Colors.green(`${year}: ${download.timeTaken} ms`))
            resolve(true)
        }))
    }

    if(promises.length > 0) {
        await Promise.all(promises)
    }
    
    console.log(Colors.green("Downloaded all!"))
}

function startJsonStream(year: number) {
    const stream = fs.createReadStream(`./data/Ano-${year}.json`)

    const parser = jsonstream.parse("dados.*")

    stream.pipe(parser)
    
    return parser
}

async function waitEnd(stream) {
    return new Promise((resolve, reject) => {
        stream.on("end", () => {
            resolve(true)
        })
    })
}


const MAX_WRITES = config.processors.expenses.transaction_size
const MAX_TRANSACTIONS = config.processors.expenses.concurrent_transactions

async function startSaveProcess(updateMode?: boolean) {

    console.log(Colors.green(`Starting expenses saving process.\nConcurrent transactions: ${MAX_TRANSACTIONS}\nTransaction size: ${MAX_WRITES}\nThis config loads up to ${MAX_TRANSACTIONS * MAX_WRITES} expenses on total.`))
    
    await prepareDatabase()

    await checkJson(updateMode)

    const years = updateMode ? [new Date().getFullYear()] : createYears(2008, new Date().getFullYear())

    let expenses = []
    let transactions_promises = []

    for(const year of years) {

        const parser = startJsonStream(year)

        let excluded = 0

        console.log(Colors.yellow(`Loading expenses from ${year}`))

        parser.on("data", async (expense: Expense) => {
            if(expense.valorLiquido < 1) {
                excluded += 1
                return;
            }

            expense.cnpjCPF = expense.cnpjCPF.split('').filter((char: any) => !isNaN(char)).join('');

            if(expense.idDeputado) {
                expense.numeroDeputadoID = Number(expense.idDeputado)
                // "numeroDeputadoID" is incorrect on most of deputies from 2020 to now, so, we will convert if has "idDeputado", because it's correct.
            }

            expense.cnpjCPF = expense.cnpjCPF.replace(/ /g, "")

            const values = Object.values(expense)

            expense.difId = `${values.join("-")}`

            if(expenses.length >= MAX_WRITES) {
                parser.pause()
                
                const copy = expenses
                expenses = []
                if(transactions_promises.length >= MAX_TRANSACTIONS) {
                    await Promise.all(transactions_promises)
                    transactions_promises = []
                }
                transactions_promises.push(transactionExpenses(copy))
                
                parser.resume()
            } else {
                expenses.push(expense)
            }            

        })

        await waitEnd(parser)

        console.log(Colors.red(`${excluded} invalid expenses excluded.`))
        console.log(Colors.green(`Loaded!`), "\n------------")
    }

    if(expenses.length > 0) {
        await transactionExpenses(expenses)
        expenses = []
    }

    console.log(expenses.length < 1 ? Colors.green(`All valid expenses saved.`) : Colors.red(`${expenses.length} expenses loss.`))
}

async function transactionExpenses(expenses: Expense[]) {
    return new Promise(async (resolve, reject) => {
        database.begin(async sql => {

            await sql`SET TRANSACTION ISOLATION LEVEL READ COMMITTED`
        
            const columns = Object.keys(expenses[0]).filter(c => c !== "idDeputado")
    
            const chunks = paginate(expenses, 1600) // We need this due to PostgreSQL params limit
            let chunk = chunks.next()

            const write_promises = []

            while(!chunk.done) {
                if(!chunk.value) {
                    break;
                }
                write_promises.push(sql`INSERT INTO "Despesas" ${sql(chunk.value, columns as any)} ON CONFLICT DO NOTHING`)   
                chunk = chunks.next()
            }

            Promise.all(write_promises).then(() => {
                resolve(true)
            })
        })
    })
}

if(require.main === module) {
    console.log(Colors.green(`Detected running directly from command line...`))
    startSaveProcess()
}

export default startSaveProcess