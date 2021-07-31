# Mongo Is On Fire!
### Reactive functionality in to your MongoDB server<br/><br/>
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
