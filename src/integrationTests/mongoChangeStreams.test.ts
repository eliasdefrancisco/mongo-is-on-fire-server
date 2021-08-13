import { ChangeStream, Collection, MongoClient } from "mongodb"
import changeStreamOperations from "../enums/changeStreamOperations"
import environments from "../enums/environments"
import configType from "../types/config"

const config = {
    environment: environments.develop,
    mongoUri: 'mongodb://localhost:27017?replicaSet=mongo-repl',
    dbName: 'mongo_is_on_fire_db',
    dbNameDev: 'mongo_is_on_fire_db_DEV',
    dbNameTest: 'mongo_is_on_fire_db_TEST',
    collectionOnFire: 'collectionOnFire',
    port: 3069,
} as configType

describe('Change Streams integration tests from Mongo Daemon', () => {
    let changeStream: ChangeStream<Document>
    let collection: Collection
    let mongoClient: MongoClient

    beforeAll(async () => {
        await MongoClient.connect(config.mongoUri)
            .then(async client => {
                mongoClient = client
                const db = mongoClient.db(config.dbNameTest)
                collection = db.collection(config.collectionOnFire)
                await collection.deleteMany({})
            })
    })

    afterAll(() => {
        changeStream.close()
        mongoClient.close()
    })

    test('Insert must return some needed fields', done => {
        changeStream = collection.watch()
        changeStream.on('change', change => {
            try {
                const operation = change.operationType
                const documentKey: any = change.documentKey
                const fullDocument: any = change.fullDocument
                const ns = change.ns
                expect(ns).toEqual({ db: config.dbNameTest, coll: config.collectionOnFire })
                expect(operation).toEqual(changeStreamOperations.insert)
                expect(documentKey._id).toBeDefined()
                expect(fullDocument._id).toBeDefined()
                expect(fullDocument.num1).toEqual(1)
                expect(fullDocument.num2).toEqual(2)
                expect(fullDocument.str1).toEqual('dummy1')
                expect(fullDocument.str2).toEqual('dummy2')
                expect(fullDocument.arr).toEqual([1, 2, 3, 4, 5])
                expect(fullDocument.obj).toEqual({ aa: 11, bb: 'dummyNested', cc: [11, 22, 33, 44, 55] })
                changeStream.close()
                done()
            }
            catch (err) {
                done(err)
            }
        })
        const batch = async () => {
            await collection.insertOne({
                num1: 1,
                num2: 2,
                str1: 'dummy1',
                str2: 'dummy2',
                arr: [1, 2, 3, 4, 5],
                obj: { aa: 11, bb: 'dummyNested', cc: [11, 22, 33, 44, 55] }
            })
        }
        setImmediate(batch)
    })

    test('Delete must return some needed fields', done => {
        let insertedId: any
        changeStream = collection.watch()
        changeStream.on('change', change => {
            try {
                const documentKey: any = change.documentKey
                const ns = change.ns
                const operation: string = change.operationType
                if (operation === changeStreamOperations.insert) {
                    insertedId = documentKey._id
                }
                else if (operation === changeStreamOperations.delete) {
                    expect(ns).toEqual({ db: config.dbNameTest, coll: config.collectionOnFire })
                    expect(documentKey._id).toEqual(insertedId)
                    changeStream.close()
                    done()
                }
            }
            catch (err) {
                done(err)
            }
        })
        const batch = async () => {
            await collection.insertOne({ aa: 11, bb: 22 })
            await collection.deleteOne({ aa: 11, bb: 22 })
        }
        setImmediate(batch)
    })

    test('Replace must return some needed fields', done => {
        let insertedId: any
        changeStream = collection.watch()
        changeStream.on('change', change => {
            try {
                const documentKey: any = change.documentKey
                const ns = change.ns
                const fullDocument: any = change.fullDocument
                const operation: string = change.operationType

                if (operation === changeStreamOperations.insert) {
                    insertedId = documentKey._id
                }
                else if (operation === changeStreamOperations.replace) {
                    expect(ns).toEqual({ db: config.dbNameTest, coll: config.collectionOnFire })
                    expect(documentKey._id).toEqual(insertedId)
                    expect(fullDocument._id).toBeDefined()
                    expect(fullDocument).toEqual({ _id: insertedId, aa: 1111, bb: 2222, cc: 3333 })
                    changeStream.close()
                    done()
                }
            }
            catch (err) {
                done(err)
            }
        })
        const batch = async () => {
            await collection.insertOne({ aa: 111, bb: 222 })
            await collection.updateOne({ aa: 111 }, [{ $set: { aa: 1111, bb: 2222, cc: 3333 } }])
        }
        setImmediate(batch)
    })

    test('Update must return some needed fields when modify document from collection with $set', done => {
        changeStream = collection.watch()
        changeStream.on('change', change => {
            try {
                const operation = change.operationType
                const documentKey: any = change.documentKey
                const updatedFields = change.updateDescription?.updatedFields
                const ns = change.ns
                expect(ns).toEqual({ db: config.dbNameTest, coll: config.collectionOnFire })
                expect(operation).toEqual(changeStreamOperations.update)
                expect(documentKey._id).toBeDefined()
                expect(updatedFields).toEqual({ str2: 'updatedStr2', num2: 22, num3: 33 })
                changeStream.close()
                done()
            }
            catch (err) {
                done(err)
            }
        })
        const batch = async () => {
            await collection.updateOne(
                { num1: 1 },
                { $set: { str2: 'updatedStr2', num2: 22, num3: 33 } }
            )
        }
        setImmediate(batch)
    })

    test('Update must return some needed fields when modify array field from document with $pull', done => {
        changeStream = collection.watch()
        changeStream.on('change', change => {

            try {
                const operation = change.operationType
                const documentKey: any = change.documentKey
                const updatedFields = change.updateDescription?.updatedFields
                const ns = change.ns
                expect(ns).toEqual({ db: config.dbNameTest, coll: config.collectionOnFire })
                expect(operation).toEqual(changeStreamOperations.update)
                expect(documentKey._id).toBeDefined()
                expect(updatedFields).toEqual({ arr: [1, 2, 3, 5] })
                changeStream.close()
                done()
            }
            catch (err) {
                done(err)
            }
        })
        const batch = async () => {
            await collection.updateOne(
                { num1: 1 },
                { $pull: { arr: 4 } }
            )
        }
        setImmediate(batch)
    })

    test('Update must return some needed fields when modify array field from document with $push', done => {
        changeStream = collection.watch()
        changeStream.on('change', change => {
            try {
                const operation = change.operationType
                const documentKey: any = change.documentKey
                const updatedFields = change.updateDescription?.updatedFields
                const ns = change.ns
                expect(ns).toEqual({ db: config.dbNameTest, coll: config.collectionOnFire })
                expect(operation).toEqual(changeStreamOperations.update)
                expect(documentKey._id).toBeDefined()
                expect(updatedFields).toEqual({ 'arr.4': 6, 'arr.5': 7, 'arr.6': 8 })
                changeStream.close()
                done()
            }
            catch (err) {
                done(err)
            }
        })
        const batch = async () => {
            await collection.updateOne(
                { num1: 1 },
                { $push: { arr: { $each: [6, 7, 8] } } }
            )
        }
        setImmediate(batch)
    })

    test('Update must return some needed fields when modify object nested field from document with $set', done => {
        changeStream = collection.watch()
        changeStream.on('change', change => {
            try {
                const operation = change.operationType
                const documentKey: any = change.documentKey
                const updatedFields = change.updateDescription?.updatedFields
                const ns = change.ns
                expect(ns).toEqual({ db: config.dbNameTest, coll: config.collectionOnFire })
                expect(operation).toEqual(changeStreamOperations.update)
                expect(documentKey._id).toBeDefined()
                expect(updatedFields).toEqual({ 'obj.addedNum': 666 })
                changeStream.close()
                done()
            }
            catch (err) {
                done(err)
            }
        })
        const batch = async () => {
            await collection.updateOne(
                { num1: 1 },
                { $set: { 'obj.addedNum': 666 } }
            )
        }
        setImmediate(batch)
    })

    test('Update must return some needed fields when remove field from document with $unset', done => {
        changeStream = collection.watch()
        changeStream.on('change', change => {
            try {
                const operation = change.operationType
                const documentKey: any = change.documentKey
                const removedFields = change.updateDescription?.removedFields
                const ns = change.ns
                expect(ns).toEqual({ db: config.dbNameTest, coll: config.collectionOnFire })
                expect(operation).toEqual(changeStreamOperations.update)
                expect(documentKey._id).toBeDefined()
                expect(removedFields).toEqual(['str2'])
                changeStream.close()
                done()
            }
            catch (err) {
                done(err)
            }
        })
        const batch = async () => {
            await collection.updateOne(
                { num1: 1 },
                { $unset: { str2: '' } }
            )
        }
        setImmediate(batch)
    })

    test('Update must return some needed fields when truncate array nested field from document', done => {
        changeStream = collection.watch()
        changeStream.on('change', change => {
            try {
                const operation = change.operationType
                const documentKey: any = change.documentKey
                const truncatedArrays = (change.updateDescription as any).truncatedArrays
                const ns = change.ns
                expect(ns).toEqual({ db: config.dbNameTest, coll: config.collectionOnFire })
                expect(operation).toEqual(changeStreamOperations.update)
                expect(documentKey._id).toBeDefined()
                expect(truncatedArrays).toEqual([{ field: 'arr', newSize: 3 }])
                changeStream.close()
                done()
            }
            catch (err) {
                done(err)
            }
        })
        const batch = async () => {
            await collection.updateOne(
                { num1: 1 },
                [{ $set: { arr: [1, 2, 3] } }]
            )
        }
        setImmediate(batch)
    })
})