import { waitForDebuggerAttach } from './helpers/common'
import { startMongoConection } from './services/mongo'


async function init() {
    await waitForDebuggerAttach()
    startMongoConection()
}


init()

