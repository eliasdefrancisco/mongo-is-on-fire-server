import { Collection, MongoClient } from 'mongodb'
import config from '../config'

export const startMongoConection = () => {
    MongoClient.connect("mongodb://localhost:27017?replicaSet=mongo-repl")
        .then(client => {
            console.log("Connected correctly to server")

            // const pipeline = [
            //     {
            //         $project: { documentKey: true }
            //     }
            // ]

            const db = client.db(config.dbName)
            const collection: Collection = db.collection(config.collectionOnFire)
            const changeStream = collection.watch() //db.watch(pipeline)


            changeStream.on("change", (change) => {
                console.log('!!! change: ', change)
            })

            // client.on('commandSucceeded', data => {
            //     if (data.commandName !== 'getMore') {
            //         console.log('!!! commandSucceeded: ', data)
            //     }
            // })

            // client.on('commandStarted', data => {
            //     if (data.commandName !== 'getMore') {
            //         console.log('!!! commandStarted: ', data)
            //     }
            // })

            // client.on('commandFailed', err => {
            //     console.log('!!! commandStarted: ', err)
            // })



            fillDummyData(collection)

        })
        .catch(err => {
            console.error(err)
        })
}



function fillDummyData(collection: Collection) {

    let interval = 0

    // delete previous data collection
    setTimeout(() => {
        collection.deleteMany({})
    }, interval += 1000)



    // Array POC -----
    setTimeout(() => {
        collection.insertOne({ arr: ['aa', 'bb', 'cc', 'dd', 'ee', 'ff', 'gg', 'hh'] })
    }, interval += 1000)

    setTimeout(async () => {
        console.log('Array list: ', await collection.find({}).toArray())
    }, interval += 1000)

    // update from array using set
    setTimeout(() => {
        collection.updateOne({}, { $set: { 'arr.1': 'bb2' } })
    }, interval += 1000)

    setTimeout(async () => {
        console.log('Update bb to bb2 using set: ', await collection.find({}).toArray())
    }, interval += 1000)

    // delete from array using pull
    setTimeout(() => {
        collection.updateOne({}, { $pull: { arr: 'cc' } })
    }, interval += 1000)

    setTimeout(async () => {
        console.log('Delete cc using pull: ', await collection.find({}).toArray())
    }, interval += 1000)

    // delete from array using pop -1 (first array element)
    setTimeout(() => {
        collection.updateOne({}, { $pop: { arr: -1 } })
    }, interval += 1000)

    setTimeout(async () => {
        console.log('Delete cc using pop(-1): ', await collection.find({}).toArray())
    }, interval += 1000)

    // delete from array using unset
    setTimeout(() => {
        collection.updateOne({}, { $unset: { 'arr.1': 'dd' } })
    }, interval += 1000)

    setTimeout(async () => {
        console.log('Delete dd using unset: ', await collection.find({}).toArray())
    }, interval += 1000)

    // delete ee and ff from array using pull
    setTimeout(() => {
        collection.updateOne({}, { $pull: { arr: { $in: ['ee', 'ff'] } } })
    }, interval += 1000)

    setTimeout(async () => {
        console.log('Delete ee and ff using pull: ', await collection.find({}).toArray())
    }, interval += 1000)

    // ----



    // Delete POC ----
    setTimeout(() => {
        collection.insertOne({ 'ironman': 'tony stark' })
    }, interval += 1000)

    setTimeout(() => {
        collection.insertOne({ 'spiderman': 'peter parker' })
    }, interval += 1000)

    setTimeout(async () => {
        console.log('Inserted two superheroes: ', await collection.find({}).toArray())
    }, interval += 1000)

    // delete existing document
    setTimeout(() => {
        collection.deleteOne({ 'spiderman': 'peter parker' })
    }, interval += 1000)

    setTimeout(async () => {
        console.log('Delete spiderman using deleteOne(): ', await collection.find({}).toArray())
    }, interval += 1000)

    // ----


    // Insert nested object ----
    setTimeout(() => {
        collection.insertOne({ 'user': { 'name': 'Pepe', 'rol': 'admin' } })
    }, interval += 1000)

    setTimeout(() => {
        collection.insertOne({
            'fruits': [
                { 'type': 'Pear', 'color': 'green' },
                { 'type': 'Melon', 'color': 'yellow' },
            ]
        })
    }, interval += 1000)

    // ----

    

    setTimeout(() => {
        console.log('End fillDummyData()')
    }, interval += 1000)

}