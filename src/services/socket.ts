import { Document } from 'mongodb'
import { Server, Socket} from 'socket.io'
import config from '../config'
import { socketListenEvents, socketEmitEvents } from '../enums/sockets'
import lang from '../lang/en'

export default class SocketService {
    private io: Server
    private socketArr: Socket[] = []

    constructor(private collectionData: Document[]) {}
    
    /**
     * Start server socket connection listening
     */
    public startSocketListen() {
        this.io = new Server(config.port)
        this.io.on( socketListenEvents.connection , (socket: Socket) => {
            this.socketArr.push(socket)
            socket.emit('welcome', lang.welcome)
            socket.emit(socketEmitEvents.collectionComplete, this.collectionData)
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