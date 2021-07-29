import config from './config'
import { waitForDebuggerAttach } from './helpers/common'


async function init() {
    console.log('Hola Mongui')
    await waitForDebuggerAttach()
    console.log('Environment: ', config.environment)
}


init()

