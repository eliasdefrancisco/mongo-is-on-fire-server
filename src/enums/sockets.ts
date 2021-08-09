export enum socketListenEvents {
    connection = 'connection',
}

export enum socketEmitEvents {
    welcome = 'welcome',
    insertDocument = 'insert-document',
    deleteDocument = 'update-document',
    replaceDocument = 'replace-document',
    updateField = 'update-field',
    removeField = 'remove-field',
    truncateArrayField = 'truncate-array-field',
    collectionComplete = 'collection-complete',
}