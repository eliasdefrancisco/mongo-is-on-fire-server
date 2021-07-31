import environments from "./enums/environments"
import configType from "./types/config"

export default {
    environment: environments.develop,
    mongoUri: 'mongodb://localhost:27017?replicaSet=mongo-repl',
    dbName: 'MIOF_DB',
    collectionOnFire: 'collectionOnFire'
} as configType