import { ChangeStreamDocument } from 'mongodb'
import config from '../config'
import changeStreamOperations from '../enums/changeStreamOperations'
import environments from '../enums/environments'
import MongoService from './mongo'

describe('Mongo Service unit and integration tests', () => {
    let mongoService: MongoService

    beforeAll(() => {
        const socketServiceMock = {
            sendToEveryClients: () => undefined
        }
        mongoService = new MongoService()
        mongoService.injectDependencies(socketServiceMock as any)
        expect(mongoService).toBeDefined()
    })

    test('startMongoConnection() has to estabilish connection', async () => {
        expect(mongoService['collectionData']).not.toBeDefined()
        expect(mongoService['changeStream']).not.toBeDefined()
        expect(mongoService['mongoClient']).not.toBeDefined()
        expect(mongoService['collection']).not.toBeDefined()
        expect(mongoService['db']).not.toBeDefined()
        await mongoService.startMongoConnection()
        expect(mongoService['collectionData']).toBeDefined()
        expect(mongoService['collectionData'].length).toBeDefined()
        expect(mongoService['changeStream']).toBeDefined()
        expect(mongoService['changeStream'].listenerCount('change')).toEqual(1)
        expect(mongoService['mongoClient']).toBeDefined()
        expect(mongoService['collection']).toBeDefined()
        expect(mongoService['collection'].collectionName).toEqual(config.collectionOnFire)
        expect(mongoService['db']).toBeDefined()
        expect(mongoService['db'].databaseName).toEqual(config.environment === environments.develop ? config.dbNameDev : config.dbName)
    })

    test('stopMongoConnection() has to close connection stuff', async () => {
        await mongoService.stopMongoConnection()
        expect(mongoService['changeStream'].listenerCount('change')).toEqual(0)
        expect(mongoService['changeStream'].closed).toBeTruthy()
    })

    test('Can connect and disconnect again', async () => {
        await mongoService.startMongoConnection()
        expect(mongoService['collectionData']).toBeDefined()
        expect(mongoService['collectionData'].length).toBeDefined()
        expect(mongoService['changeStream']).toBeDefined()
        expect(mongoService['changeStream'].listenerCount('change')).toEqual(1)
        expect(mongoService['mongoClient']).toBeDefined()
        expect(mongoService['collection']).toBeDefined()
        expect(mongoService['collection'].collectionName).toEqual(config.collectionOnFire)
        expect(mongoService['db']).toBeDefined()
        expect(mongoService['db'].databaseName).toEqual(config.environment === environments.develop ? config.dbNameDev : config.dbName)
        await mongoService.stopMongoConnection()
        expect(mongoService['changeStream'].listenerCount('change')).toEqual(0)
        expect(mongoService['changeStream'].closed).toBeTruthy()
    })

    test('Chage Stream Listener(change) has to route change events for insert, update, replace and delete operations', async () => {
        await mongoService.startMongoConnection()
        try {
            const insertFunctionMock = jest.spyOn(mongoService, 'insertFromCollection' as never)
            const updateFunctionMock = jest.spyOn(mongoService, 'updateFromCollection' as never)
            const replaceFunctionMock = jest.spyOn(mongoService, 'replaceFromCollection' as never)
            const deleteFunctionMock = jest.spyOn(mongoService, 'deleteFromCollection' as never)
            mongoService['changeStream'].emit('change', { operationType: changeStreamOperations.insert, documentKey: 'dummyKey' as any } as ChangeStreamDocument)
            mongoService['changeStream'].emit('change', { operationType: changeStreamOperations.update, documentKey: 'dummyKey' as any } as ChangeStreamDocument)
            mongoService['changeStream'].emit('change', { operationType: changeStreamOperations.replace, documentKey: 'dummyKey' as any } as ChangeStreamDocument)
            mongoService['changeStream'].emit('change', { operationType: changeStreamOperations.delete, documentKey: 'dummyKey' as any } as ChangeStreamDocument)
            expect(insertFunctionMock).toHaveBeenCalledWith({ operationType: changeStreamOperations.insert, documentKey: 'dummyKey' })
            expect(updateFunctionMock).toHaveBeenCalledWith({ operationType: changeStreamOperations.update, documentKey: 'dummyKey' })
            expect(replaceFunctionMock).toHaveBeenCalledWith({ operationType: changeStreamOperations.replace, documentKey: 'dummyKey' })
            expect(deleteFunctionMock).toHaveBeenCalledWith({ operationType: changeStreamOperations.delete, documentKey: 'dummyKey' })
            jest.resetAllMocks()
            jest.restoreAllMocks()
        }
        finally {
            await mongoService.stopMongoConnection()
        }
    })

    test('private deleteFromCollection() have to remove document right way on collectionData[]', async () => {
        await mongoService.startMongoConnection()
        try {
            mongoService['collectionData'] = [{ _id: 111 }]
            expect( mongoService['collectionData']).toEqual([{ _id: 111 }])
            mongoService['deleteFromCollection']({ documentKey: { _id: 111 } as any } as ChangeStreamDocument)
            expect( mongoService['collectionData']).toEqual([])
        }
        finally {
            await mongoService.stopMongoConnection()
        }
    })

    test('private insertFromCollection() have to insert document right way on collectionData[]', async () => {
        await mongoService.startMongoConnection()
        try {
            mongoService['collectionData'] = []
            expect( mongoService['collectionData']).toEqual([])
            mongoService['insertFromCollection']({ fullDocument: { _id: 111 } as any } as ChangeStreamDocument)
            expect( mongoService['collectionData']).toEqual([{ _id: 111 }])
        }
        finally {
            await mongoService.stopMongoConnection()
        }
    })

    test('private replaceFromCollection() have to replace document right way on collectionData[]', async () => {
        await mongoService.startMongoConnection()
        try {
            mongoService['collectionData'] = [{ _id: 111, dummy: 'aa' }]
            expect( mongoService['collectionData']).toEqual([{ _id: 111, dummy: 'aa' }])
            mongoService['replaceFromCollection']({ 
                documentKey: { _id: 111 } as any, 
                fullDocument: { _id: 111, dummy: 'bb' } as any,
            } as ChangeStreamDocument)
            expect( mongoService['collectionData']).toEqual([{ _id: 111, dummy: 'bb' }])
        }
        finally {
            await mongoService.stopMongoConnection()
        }
    })

    test('private updateFromCollection() have to remove document field right way on collectionData[]', async () => {
        await mongoService.startMongoConnection()
        try {
            mongoService['collectionData'] = [{ _id: 111, dummy: 'aa', dummy2: 'bb' }]
            expect( mongoService['collectionData']).toEqual([{ _id: 111, dummy: 'aa', dummy2: 'bb' }])
            mongoService['updateFromCollection']({ 
                documentKey: { _id: 111 } as any, 
                updateDescription: { removedFields: ['dummy'] } as any,
            } as ChangeStreamDocument)
            expect( mongoService['collectionData']).toEqual([{ _id: 111, dummy2: 'bb' }])
        }
        finally {
            await mongoService.stopMongoConnection()
        }
    })

    test('private updateFromCollection() have to truncate document array field right way on collectionData[]', async () => {
        await mongoService.startMongoConnection()
        try {
            mongoService['collectionData'] = [{ _id: 111, arr: [1, 2, 3, 4, 5, 6] }]
            expect( mongoService['collectionData']).toEqual([{ _id: 111, arr: [1, 2, 3, 4, 5, 6] }])
            mongoService['updateFromCollection']({ 
                documentKey: { _id: 111 } as any, 
                updateDescription: { truncatedArrays: [{ field: 'arr', newSize: 3 }] } as any,
            } as ChangeStreamDocument)
            expect( mongoService['collectionData']).toEqual([{ _id: 111, arr: [1, 2, 3] }])
        }
        finally {
            await mongoService.stopMongoConnection()
        }
    })

    test('private updateFromCollection() have to update document field right way on collectionData[]', async () => {
        await mongoService.startMongoConnection()
        try {
            mongoService['collectionData'] = [{ _id: 111, dummy: 'aa' }]
            expect( mongoService['collectionData']).toEqual([{ _id: 111, dummy: 'aa' }])
            mongoService['updateFromCollection']({ 
                documentKey: { _id: 111 } as any, 
                updateDescription: { updatedFields: { dummy: 'bb' } } as any,
            } as ChangeStreamDocument)
            expect( mongoService['collectionData']).toEqual([{ _id: 111, dummy: 'bb' }])
        }
        finally {
            await mongoService.stopMongoConnection()
        }
    })

    test('private updateFromCollection() have to update document array field right way on collectionData[]', async () => {
        await mongoService.startMongoConnection()
        try {
            mongoService['collectionData'] = [{ _id: 111, arr: [1, 2, 3, 4] }]
            expect( mongoService['collectionData']).toEqual([{ _id: 111, arr: [1, 2, 3, 4] }])
            mongoService['updateFromCollection']({ 
                documentKey: { _id: 111 } as any, 
                updateDescription: { updatedFields: { 'arr.0': 11, 'arr.1': 22 } } as any,
            } as ChangeStreamDocument)
            expect( mongoService['collectionData']).toEqual([{ _id: 111, arr: [11, 22, 3, 4] }])
        }
        finally {
            await mongoService.stopMongoConnection()
        }
    })

    test('private updateFromCollection() have to update document array field right way on collectionData[]', async () => {
        await mongoService.startMongoConnection()
        try {
            mongoService['collectionData'] = [{ _id: 111, arr: [1, 2, 3, 4] }]
            expect( mongoService['collectionData']).toEqual([{ _id: 111, arr: [1, 2, 3, 4] }])
            mongoService['updateFromCollection']({ 
                documentKey: { _id: 111 } as any, 
                updateDescription: { updatedFields: { arr: [11, 22, 33, 44] } } as any,
            } as ChangeStreamDocument)
            expect( mongoService['collectionData']).toEqual([{ _id: 111, arr: [11, 22, 33, 44] }])
        }
        finally {
            await mongoService.stopMongoConnection()
        }
    })

})