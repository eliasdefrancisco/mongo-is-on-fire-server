import environments from "../enums/environments"

export default interface configType {
    environment: environments,
    mongoUri: string,
    dbName: string,
    collectionOnFire: string,
}