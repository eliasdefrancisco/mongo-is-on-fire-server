import { ChangeStreamDocument, Collection, MongoClient, Document } from 'mongodb'
import config from '../config'
import changeStreamOperations from '../enums/changeStreamOperations'
import _get from 'lodash.get'
import _set from 'lodash.set'

let collectionData: Document[]

export const startMongoConection = () => {
    MongoClient.connect("mongodb://localhost:27017?replicaSet=mongo-repl")
        .then(async client => {
            console.log("Connected correctly to server")

            // TODO: Implement pipeline for optimization para el metodo watch() (https://docs.mongodb.com/manual/reference/method/db.collection.watch/)
            // const pipeline = [
            //     {
            //         $project: { documentKey: true }
            //     }
            // ]

            const db = client.db(config.dbName)
            const collection: Collection = db.collection(config.collectionOnFire)

            collectionData = await collection.find({}).toArray()
            console.log('!!! collectionData init: ', collectionData)

            const changeStream = collection.watch()
            changeStream.on('change', (change: ChangeStreamDocument<Document>) => {
                console.log('!!! change: ', change)

                const op = change.operationType
                if      (op === changeStreamOperations.insert)  insertFromCollection(change)
                else if (op === changeStreamOperations.update)  updateFromCollection(change)
                else if (op === changeStreamOperations.replace) replaceFromCollection(change)
                else if (op === changeStreamOperations.delete)  deleteFromCollection(change)

                console.log('!!! collectionData: ', collectionData)
            })

            fillDummyData(collection)

        })
        .catch(err => {
            console.error(err)
        })
}

const deleteFromCollection = (change: ChangeStreamDocument<Document>) => {
    const documentKey = _get(change, 'documentKey', { _id: null }) as any
    const deletedIndex = findCollectionIndexByDocumentKey(documentKey)
    if (deletedIndex >= 0) {
        collectionData.splice(deletedIndex, 1)
    }
}

const insertFromCollection = (change: ChangeStreamDocument<Document>) => {
    const fullDocument = _get(change, 'fullDocument', { _id: null }) as any
    if (fullDocument._id) {
        collectionData.push(fullDocument)
    }
}

const replaceFromCollection = (change: ChangeStreamDocument<Document>) => {
    const fullDocument = _get(change, 'fullDocument', { _id: null }) as any
    if (fullDocument._id) {
        const documentKey = _get(change, 'documentKey', { _id: null }) as any
        const replacedIndex = findCollectionIndexByDocumentKey(documentKey)
        collectionData[replacedIndex] = fullDocument
    }
}

const updateFromCollection = (change: ChangeStreamDocument<Document>) => {
    const documentKey = _get(change, 'documentKey', { _id: null }) as any
    const updatedIndex = findCollectionIndexByDocumentKey(documentKey)
    const removedFields = _get(change, 'updateDescription.removedFields', []) as any
    const truncatedArrays = _get(change, 'updateDescription.truncatedArrays', []) as any
    const updatedFields = _get(change, 'updateDescription.updatedFields', {}) as any
    const updateFieldsKeys = Object.keys(updatedFields)

    if (documentKey._id) {
        if (removedFields.length > 0) {
            removedFields.forEach((removedField: string) => {
                delete collectionData[updatedIndex][removedField]
            });
        }
        if (truncatedArrays.length > 0) {
            truncatedArrays.forEach((truncatedArray: { field: string, newSize: number })  => {
                collectionData[updatedIndex][truncatedArray.field].length = truncatedArray.newSize
            });
        }
        if (updateFieldsKeys.length > 0) {
            updateFieldsKeys.forEach((updatedKey: string) => {
                const updatedValue = _get(change, `updateDescription.updatedFields['${updatedKey}']`, null) as any
                _set(collectionData[updatedIndex], updatedKey, updatedValue)
            })
        }
    }
}


const findCollectionIndexByDocumentKey = (documentKey: any): number => {
    return collectionData.findIndex(document => {
        return document._id.toString() === documentKey._id.toString()
    })
}








function fillDummyData(collection: Collection) {

    let interval = 0

    // delete previous data collection
    setTimeout(() => {
        collection.deleteMany({})
    }, interval += 1000)

    

    // Update Document POC -----
    setTimeout(() => {
        collection.insertOne({ 
            characters: ['aa', 'bb', 'cc', 'dd', 'ee', 'ff', 'gg', 'hh'],
            person: { name: 'Eli', surname: 'As', age: 43 },
            buy: 'TV',
            price: 1234.56,
            msg: 'ola k ase',
            products: [{ id: 11, name: 'TV' }, { id: 2, name: 'CD' }, { id: 3, name: 'DVD' }]
        })
        collection.insertOne({ dummy1: 1 })
        collection.insertOne({ dummy2: 2 })
        collection.insertOne({ dummy3: 3 })
        collection.insertOne({ dummy4: 4 })
    }, interval += 1000)

    setTimeout(() => {
        collection.updateOne({ buy: 'TV' }, { $set: { price: 1111.11 } })
        console.log('!!! update price to 1111.11')
    }, interval += 1000)

    setTimeout(() => {
        collection.updateOne({ buy: 'TV' }, { $set: { 'characters.5': 'ff55' } })
        console.log('!!! update array characters[5] to aa11')
    }, interval += 1000)

    setTimeout(() => {
        collection.updateOne({ dummy1: 1 }, [{ $set: { 'dummy1': 'newDummy1', buy: 'PC' } }])
        console.log('!!! update document to new document with set [operationType: replace] !!!')
    }, interval += 1000)

    setTimeout(() => {
        collection.updateOne({ buy: 'TV' }, [{ $set: { characters: ['aa', 'bb'] } }])
        console.log('!!! update document to new document with set [truncatedArrays] !!!')
    }, interval += 1000)

    setTimeout(() => {
        collection.updateOne({ buy: 'TV' }, { $pull: { characters: 'bb' } })
        console.log('!!! update array characters with val:bb removed')
    }, interval += 1000)

    setTimeout(() => {
        collection.updateOne({ buy: 'TV' }, { $unset: { msg: '' } })
        console.log('!!! update field msg remove [removedFields] !!!')
    }, interval += 1000)
    
    setTimeout(() => {
        collection.updateOne({ buy: 'TV' }, { $push: { characters: 'ii' } })
        console.log('!!! update field chareacters val:ii added with $push')
    }, interval += 1000)
    
    setTimeout(() => {
        collection.updateOne({ buy: 'TV' }, [{ $addFields: { city: 'Jerez' } }])
        console.log('!!! update field city added')
    }, interval += 1000)

    setTimeout(() => {
        collection.updateMany({ buy: 'TV' }, [ { $addFields: { products: { $concatArrays: [ '$products', [{ id: 4, name: 'PC' }, { id: 5, name: 'USB' }] ] } } } ])
        console.log('!!! update document adding new fields to array products with $addFields and $concatArrays')
    }, interval += 1000)







    // // Array POC -----
    // setTimeout(() => {
    //     collection.insertOne({ arr: ['aa', 'bb', 'cc', 'dd', 'ee', 'ff', 'gg', 'hh'] })
    // }, interval += 1000)

    // setTimeout(async () => {
    //     console.log('Array list: ', await collection.find({}).toArray())
    // }, interval += 1000)

    // // update from array using set
    // setTimeout(() => {
    //     collection.updateOne({}, { $set: { 'arr.1': 'bb2' } })
    // }, interval += 1000)

    // setTimeout(async () => {
    //     console.log('Update bb to bb2 from array using set: ', await collection.find({}).toArray())
    // }, interval += 1000)

    // // delete from array using pull
    // setTimeout(() => {
    //     collection.updateOne({}, { $pull: { arr: 'cc' } })
    // }, interval += 1000)

    // setTimeout(async () => {
    //     console.log('Delete cc from array using pull: ', await collection.find({}).toArray())
    // }, interval += 1000)

    // // delete from array using pop -1 (first array element)
    // setTimeout(() => {
    //     collection.updateOne({}, { $pop: { arr: -1 } })
    // }, interval += 1000)

    // setTimeout(async () => {
    //     console.log('Delete cc from array using pop(-1): ', await collection.find({}).toArray())
    // }, interval += 1000)

    // // delete from array using unset
    // setTimeout(() => {
    //     collection.updateOne({}, { $unset: { 'arr.1': 'dd' } })
    // }, interval += 1000)

    // setTimeout(async () => {
    //     console.log('Delete dd from array using unset: ', await collection.find({}).toArray())
    // }, interval += 1000)

    // // delete ee and ff from array using pull
    // setTimeout(() => {
    //     collection.updateOne({}, { $pull: { arr: { $in: ['ee', 'ff'] } } })
    // }, interval += 1000)

    // setTimeout(async () => {
    //     console.log('Delete ee and ff from array using pull: ', await collection.find({}).toArray())
    // }, interval += 1000)

    // // ----



    // // Delete POC ----
    // setTimeout(() => {
    //     collection.insertOne({ 'ironman': 'tony stark' })
    // }, interval += 1000)

    // setTimeout(() => {
    //     collection.insertOne({ 'spiderman': 'peter parker' })
    // }, interval += 1000)

    // setTimeout(async () => {
    //     console.log('Inserted two superheroes: ', await collection.find({}).toArray())
    // }, interval += 1000)

    // // delete existing document
    // setTimeout(() => {
    //     collection.deleteOne({ 'spiderman': 'peter parker' })
    // }, interval += 1000)

    // setTimeout(async () => {
    //     console.log('Delete spiderman using deleteOne(): ', await collection.find({}).toArray())
    // }, interval += 1000)

    // // ----


    // // Insert nested object ----
    // setTimeout(() => {
    //     collection.insertOne({ 'user': { 'name': 'Pepe', 'rol': 'admin' } })
    // }, interval += 1000)

    // setTimeout(() => {
    //     collection.insertOne({
    //         'fruits': [
    //             { 'type': 'Pear', 'color': 'green' },
    //             { 'type': 'Melon', 'color': 'yellow' },
    //         ]
    //     })
    // }, interval += 1000)

    // // ----



    setTimeout(() => {
        console.log('End fillDummyData()')
    }, interval += 1000)

}