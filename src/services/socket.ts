import { Server, Socket} from 'socket.io'
import { socketListenEvents, socketEmitEvents } from '../enums/sockets'
import lang from '../lang/en'
import configType from '../types/config'
import MongoService from './mongo'

export default class SocketService {
    private io: Server
    private socketArr: Socket[] = []
    private mongoService: MongoService

    /**
     * Inject needed dependencies after creation, for avoiding circular dependency problems
     * @param mongoService MongoDB service dependency
     */
    public injectDependencies(mongoService: MongoService){
        this.mongoService = mongoService
    }
    
    /**
     * Start server socket connection listening
     */
     public startSocketListen(config: configType) {
        this.io = new Server(config.port)
        this.io.on( socketListenEvents.connection , (socket: Socket) => {
            this.socketArr.push(socket)
            socket.emit('welcome', lang.welcome)
            socket.emit(socketEmitEvents.collectionComplete, this.mongoService.getCollection())
        })
    }

    /**
     * Remove listeners to every clients and close server connection
     */
    public stopSocketListen() {
        this.socketArr.forEach(socket => {
            socket.removeAllListeners()
            socket.disconnect()
        })
        this.socketArr.length = 0
        this.io.removeAllListeners()
        this.io.close()
    }

    /**
     * Send events to every connected clients
     * @param eventName Event type to send to clients
     * @param data Information you want to send to clients
     */
    public sendToEveryClients(eventName: socketEmitEvents, data: any) {
        this.io.local.emit(eventName, data)
    }
}