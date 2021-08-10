export enum socketListenEvents {
    connection = 'connection',
}

export enum socketEmitEvents {
    welcome = 'welcome',
    insertDocument = 'insertDocument',
    deleteDocument = 'deleteDocument',
    replaceDocument = 'replaceDocument',
    updateField = 'updateField',
    removeField = 'removeField',
    truncateArrayField = 'truncateArrayField',
    collectionComplete = 'collectionComplete',
}