# Vita Server 

## What is Vita Server
Vita Server is a RESTful feed and dedicated TCP server for *Vita's Raising* which is an interactive smart flowerpot that connects with the Internet. 

## How to run this server

Vita Server is developed with [Node.js](https://nodejs.org) and [MongoDB](http://www.mongodb.org). You should insure them are properly installed and configured. In order to access a MongoDB server with in Node.js; You should also have *MongoDB driver for Node.js* (aka [node-mongodb-native](http://mongodb.github.io/node-mongodb-native/)) installed. 

* Clone the code

		git clone git@github.com:kqkq/vita-server.git
		
* Install the MongoDB driver

		npm install mongodb -g
		 		
* Create a link for Vita Server

		cd vita-server
		npm link mongodb
		
* Initialize the database

		mongo
		use vita
	
	Then copy the code in `counter-initialize.js` to the MongoDB REPL environment. This will create one main counter and 365 daily counters (for the year of 2015). 
		
* Start up the server

		node server.js
		
* Use `supervisor` to keep the server up and running

		supervisor server.js
		
* Following messages should be prompted while the server start up normally

		TCP server listening on port 9058
		Connected to MongoDB
		HTTP server listening on port 8080
		
## RESTful API

### Query the state of the flowerpot

1. `GET /light`
2. `GET /air`
3. `GET /water`
4. `GET /heater`

### Operate the state of the flowerpot

1. `GET /light?dim={0..255}`
2. `GET /air?action={on|off}`
3. `GET /water?action={on|off}`
4. `GET /heater?action={on|off}`

### Review the operation log

1. `GET /history`
2. `GET /history?limit={Number}`

### Query the participant counter

1. `GET /counter/main`

### Query the statistics data

1. `GET /counter/daily`

## Static HTTP Server

## Dedicated TCP Protocol

### Handshake

### Keep-alive

### Operate the flowerpot

## Running behind the Nginx reverse proxy