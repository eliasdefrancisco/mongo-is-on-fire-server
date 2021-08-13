import MongoIsOnFireServer from '.'
import configType from './types/config'

let mongoIsOnFire: MongoIsOnFireServer

const config = {
    mongoUri: 'mongodb://localhost:27017?replicaSet=mongo-repl',
    dbName: 'mongo_is_on_fire_db',
    collectionOnFire: 'collectionOnFire',
    port: 3069,
} as configType

async function mongoIsOnFireServerStart() {
    mongoIsOnFire = new MongoIsOnFireServer(config)
    await mongoIsOnFire.init()
}

mongoIsOnFireServerStart()
