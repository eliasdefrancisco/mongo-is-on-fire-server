import environments from './enums/environments'
import { waitForDebuggerAttach } from './helpers/common'
import MongoService from './services/mongo'
import SocketService from './services/socket'
import configType from './types/config'


export default class MongoIsOnFireServer {
    private mongoService: MongoService
    private socketService: SocketService

    constructor(private config: configType) {}

    /**
     * Starts MongoIsOnFireServer
     */
    public async init() {
        if (this.config.environment === environments.develop) await waitForDebuggerAttach(this.config)
        this.mongoService = new MongoService()
        this.socketService = new SocketService()
        this.mongoService.injectDependencies(this.socketService)
        this.socketService.injectDependencies(this.mongoService)
        await this.mongoService.startMongoConnection(this.config)
        this.socketService.startSocketListen(this.config)
        console.log('Mongo Is On Fire !!')
    }

    /**
     * Stop MongoIsOnFireServer
     */
    public end() {
        this.mongoService.stopMongoConnection()
        this.socketService.stopSocketListen()
        console.log('... MongoIsOnFire finished.')
    }
}


/**
 * Only for developing purposes
 */
// import { areWeTestingWithJest } from './helpers/common'
// export async function initDev(){
//     const config = {
//         environment: environments.develop,
//         mongoUri: 'mongodb://localhost:27017?replicaSet=mongo-repl',
//         dbName: 'mongo_is_on_fire_db',
//         dbNameDev: 'mongo_is_on_fire_db_DEV',
//         dbNameTest: 'mongo_is_on_fire_db_TEST',
//         collectionOnFire: 'collectionOnFire',
//         port: 3069,
//     } as configType

//     const mongoIsOnFire = new MongoIsOnFireServer(config)
//     await mongoIsOnFire.init()
    
//     process.on('SIGINT', mongoIsOnFire.end)
// }
// if (!areWeTestingWithJest()) initDev()
