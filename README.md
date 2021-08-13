# Mongo Is On Fire!
### Reactive functionality in to your MongoDB server<br/><br/>

## You can use this server on two ways
### Clone this repository on your server, install dependencies and run a script 
```
git clone https://github.com/eliasdefrancisco/mongo-is-on-fire-server.git
npm install
npm build
node dist/start
``` 
Modify your server configuration inside file src/start before run 'npm build'<br/><br/>


### Adding npm package to your current node server application (TypeScript supported)
```
npm i mongo-is-on-fire-server
...
mongoIsOnFire = new MongoIsOnFireServer(config)
mongoIsOnFire.init()
```
Take a look for file src/start.ts to get an implementation idea ;-)<br/><br/>

## Requirements
### Running Replica Set in to your Mongo Daemon Server<br/><br/>
- You have to active Replica Set functionality in your Mongo Daemon, to do that you can run your Monogo Daemon like that on your server:
```
mongod --replSet mongo-repl
```
- Now you have to connect to your Mongo Daemon with your terminal (mongosh) and run this command:
```
rs.initiate() 
```
