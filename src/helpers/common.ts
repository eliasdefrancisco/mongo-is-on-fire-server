import environments from "../enums/environments"
import configType from "../types/config"


/**
 * Wait a number of milliseconds to resolve a promise
 * 
 * @param ms Number of milliseconds to wait for
 * @returns Resolved promise when count down of milliseconds ends
 */
export function sleep(ms: number) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms)
    })
}


/**
 * Wait two seconds if project is in developing state, to give time for debbuger to attach the event
 */
export async function waitForDebuggerAttach(config: configType) {
    if (config.environment === environments.develop) {
        await sleep(2000)
    }
}

/**
 * Determines if the code is running over jest tests
 * @returns True if running with Jest, otherwise false
 */
export function areWeTestingWithJest() {
    return process.env.JEST_WORKER_ID !== undefined
}


/**
 * Convert a string used like a version number, to its logic integer number. ie '1.002.alpha-3' => 123000
 * @param ver String version number
 * @returns Integer logic number fron string version
 */
export function versionStringToNumber(ver: string): number {
    const maxGroupedNumbers = 6
    const verArr = ver.split(/[.,_-]+/g)
    const onlyNumbersVerArr = verArr.map(field => +field).filter(field => !isNaN(field))
    const oldLength = onlyNumbersVerArr.length
    onlyNumbersVerArr.length = maxGroupedNumbers
    const normalizedArr = onlyNumbersVerArr.fill(0, oldLength, maxGroupedNumbers)
    return +normalizedArr.join('')
}