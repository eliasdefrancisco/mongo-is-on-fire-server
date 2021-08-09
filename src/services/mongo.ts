import { ChangeStreamDocument, Collection, MongoClient, Document, ChangeStream, Db } from 'mongodb'
import _get from 'lodash.get'
import _set from 'lodash.set'
import config from '../config'
import changeStreamOperations from '../enums/changeStreamOperations'
import environments from '../enums/environments'
import SocketService from './socket'
import { socketEmitEvents } from '../enums/sockets'

export default class MongoService {
    private collectionData: Document[]
    private changeStream: ChangeStream<Document>
    private mongoClient: MongoClient
    private collection: Collection
    private db: Db

    /**
     * Instances MongoService class
     * @param socketService Started socket service for sending events
     */
    constructor(private socketService: SocketService) {}

    /**
     * Starts database connection and initializes local related database objects
     * @returns Mongo client connection promise
     */
    public startMongoConnection() {
        return MongoClient.connect(config.mongoUri)
            .then(async client => {
                this.mongoClient = client
                this.db = this.mongoClient.db(config.environment === environments.develop ? config.dbNameDev : config.dbName)
                this.collection = this.db.collection(config.collectionOnFire)
                this.collectionData = await this.collection.find({}).toArray()
                const pipeline = [
                    {
                        $project: { 
                            documentKey: true, 
                            ns: true, 
                            operationType: true, 
                            fullDocument: true, 
                            updateDescription: true,
                        }
                    }
                ]
                this.changeStream = this.collection.watch(pipeline)
                this.changeStream.on('change', (change: ChangeStreamDocument<Document>) => {
                    const op = change.operationType
                    if      (op === changeStreamOperations.insert) this.insertFromCollection(change)
                    else if (op === changeStreamOperations.update) this.updateFromCollection(change)
                    else if (op === changeStreamOperations.replace) this.replaceFromCollection(change)
                    else if (op === changeStreamOperations.delete) this.deleteFromCollection(change)
                })
            })
            .catch(err => {
                console.error(err)
            })
    }

    /**
     * Stop database connection and closes related objects
     */
    public async stopMongoConnection() {
        this.changeStream.removeAllListeners()
        this.changeStream.close()
        await this.mongoClient.close()
    }

    /**
     * Returns complete local data collection
     * @returns Collection data array
     */
    public getCollection(): Document[] {
        return this.collectionData
    }

    /** 
     * Delete entire document from collection
     * @param change Returned object from Mongo Daemon identifing removed document 
     */
    private deleteFromCollection(change: ChangeStreamDocument<Document>) {
        const documentKey = _get(change, 'documentKey', { _id: null }) as any
        const deletedIndex = this.findCollectionIndexByDocumentKey(documentKey)
        if (!deletedIndex && deletedIndex !== 0) return
        this.collectionData.splice(deletedIndex, 1)
        this.socketService.sendToEveryClients(socketEmitEvents.deleteDocument, deletedIndex)
    }
    
    /**
     * Insert document into collection
     * @param change Returned object from Mongo Daemon identifing and describing new document
     */
    private insertFromCollection(change: ChangeStreamDocument<Document>) {
        const fullDocument = _get(change, 'fullDocument', { _id: null }) as any
        if (fullDocument._id) {
            this.collectionData.push(fullDocument)
            this.socketService.sendToEveryClients(socketEmitEvents.insertDocument, fullDocument)
        }
    }
    
    /**
     * Replace entire document from collection
     * @param change Returned object from Mongo Daemon identifing and describing new document
     */
    private replaceFromCollection(change: ChangeStreamDocument<Document>) {
        const fullDocument = _get(change, 'fullDocument', { _id: null }) as any
        const documentKey = _get(change, 'documentKey', { _id: null }) as any
        if (fullDocument._id && documentKey._id) {
            const replacedIndex = this.findCollectionIndexByDocumentKey(documentKey)
            if (!replacedIndex && replacedIndex !== 0) return 
            this.collectionData[replacedIndex] = fullDocument
            this.socketService.sendToEveryClients(socketEmitEvents.replaceDocument, { replacedIndex, fullDocument })
        }
    }
    
    /**
     * Update document structure and fields from document into a collection
     * @param change Returned object from Mongo Daemon identifing updated document and applied changes
     */
    private updateFromCollection(change: ChangeStreamDocument<Document>) {
        const documentKey = _get(change, 'documentKey', { _id: null }) as any
        const updatedIndex = this.findCollectionIndexByDocumentKey(documentKey)
        if (!updatedIndex && updatedIndex !== 0) return 
        const removedFields = _get(change, 'updateDescription.removedFields', []) as any
        const truncatedArrays = _get(change, 'updateDescription.truncatedArrays', []) as any
        const updatedFields = _get(change, 'updateDescription.updatedFields', {}) as any
        const updateFieldsKeys = Object.keys(updatedFields)  
        if (removedFields.length > 0) {
            removedFields.forEach((removedField: string) => {
                delete this.collectionData[updatedIndex][removedField]
                this.socketService.sendToEveryClients(socketEmitEvents.removeField, { updatedIndex, removedField })
            });
        }
        if (truncatedArrays.length > 0) {
            truncatedArrays.forEach((truncatedArray: { field: string, newSize: number })  => {
                this.collectionData[updatedIndex][truncatedArray.field].length = truncatedArray.newSize
                this.socketService.sendToEveryClients(socketEmitEvents.truncateArrayField, { updatedIndex, truncatedArray })
            });
        }
        if (updateFieldsKeys.length > 0) {
            updateFieldsKeys.forEach((updatedKey: string) => {
                const updatedValue = _get(change, `updateDescription.updatedFields['${updatedKey}']`, null) as any
                _set(this.collectionData[updatedIndex], updatedKey, updatedValue)
                this.socketService.sendToEveryClients(socketEmitEvents.updateField, { updatedIndex, updatedKey, updatedValue })
            })
        }
    }
    
    /**
     * Get index from local collection data array based on its documentKey._id
     * @param documentKey Document into a collection identifier
     * @returns Index number from local collection data array based on its documentKey._id or nothing if documentKey._id does not exist
     */
    private findCollectionIndexByDocumentKey(documentKey: { _id: any }): number | void {
        if(documentKey._id){
            return this.collectionData.findIndex(document => {
                return document._id.toString() === documentKey._id.toString()
            })
        }
    }
}
