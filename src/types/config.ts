import environments from "../enums/environments"

export default interface configType {
    environment: environments,
    mongoUri: string,
    dbName: string,
    dbNameDev: string,
    dbNameTest: string,
    collectionOnFire: string,
    port: number,
}