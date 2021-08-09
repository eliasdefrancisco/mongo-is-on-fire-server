import environments from "./enums/environments"
import configType from "./types/config"

export default {
    environment: environments.develop,
    mongoUri: 'mongodb://localhost:27017?replicaSet=mongo-repl',
    dbName: 'mongo_is_on_fire_db',
    dbNameDev: 'mongo_is_on_fire_db_DEV',
    dbNameTest: 'mongo_is_on_fire_db_TEST',
    collectionOnFire: 'collectionOnFire',
    port: 3069,
} as configType