/**
 * Get age from date string
 * @param date The string date to get age, example: 1984-01-31
 */
function GetAgeFromDate(date: string) {
    const currentDate = new Date()
    const jsdate = new Date(date)

    const year = jsdate.getFullYear()
    const month = jsdate.getMonth() + 1

    const currentYear = currentDate.getFullYear()
    const currentMonth = currentDate.getMonth()

    const age = currentMonth < month ? currentYear - year - 1 : currentYear - year
    return age
}

export default GetAgeFromDate