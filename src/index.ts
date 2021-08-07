import { waitForDebuggerAttach } from './helpers/common'
import MongoService from './services/mongo'


async function init() {
    await waitForDebuggerAttach()
    const mongoService = new MongoService()
    console.log('!!! Starting Mongo Connection for 10 secs')
    mongoService.startMongoConnection()
    setTimeout(() => {
        console.log('!!! Stopping Mongo Connection')
        mongoService.stopMongoConnection()
    }, 10000);
}


init()

