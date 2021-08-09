import config from './config'
import environments from './enums/environments'
import { waitForDebuggerAttach } from './helpers/common'
import MongoService from './services/mongo'
import SocketService from './services/socket'

let mongoService: MongoService
let socketService: SocketService

async function init() {
    if (config.environment === environments.develop) await waitForDebuggerAttach()
    mongoService = new MongoService(socketService)
    await mongoService.startMongoConnection()
    socketService = new SocketService(mongoService.getCollection())
    socketService.startSocketListen()
}


function end() {
    mongoService.stopMongoConnection()
    socketService.stopSocketListen()
}


process.on('SIGINT', end)
init()
