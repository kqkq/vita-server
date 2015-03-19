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

All of the APIs above should return JSON strings like this:

    {"ready":true,"light":255,"air":false,"water":true,"remaining":0,"total":600,"heater":true}

KV pairs:

* `ready`: Boolean, if a device is connected to the server and can be operate.
* `light`: 8-bit integer, current brightness of the light.
* `air`: Boolean, current status of the fan, `true` if the fan is on, `false` if the fan is off.
* `water`: Boolean, `true` if you can water the flowers, `false` if the flowers are watered too often.
* `remaining`: Integer, the time (in seconds)  you have to wait until that you can water the flowers.
* `total`: Integer, the maximum time (in seconds) you might have to wait until you can water the flowers.
* `heater`: Boolean, current status of the heater, `true` if the heater is on, `false` if the heater is off.

### Operate the state of the flowerpot

1. `GET /light?dim={0..255}`
2. `GET /air?action={on|off}`
3. `GET /water?action={on|off}`
4. `GET /heater?action={on|off}`

All of the APIs above should return JSON strings that indicate the current status of a device. Key-value pairs are as same as querying.

### Review the operation log

1. `GET /history`

Return 200 entries of latest operation history.

2. `GET /history?limit={Number}`

Return limited `Number`s of latest operation history.

Returned JSON:

* `ip`: String, participant's IP address.
* `loc`: Unicode string, participant's location. 
* `time`: ISODate string, UTC timestamp (milliseconds since 1970-01-01 00:00 UTC+0) of an operation.
* `device`: String, could be `light`, `air`, `water`, `heater`
* `action`: 8-bit integer when `device` is `light`, indicate the brightness of the lights. String otherwise, could be `on` or `off`, indicate the operation.

### Query the participant counter

1. `GET /counter/main`

Return the number of participants (or operations) since the begining of the project.

KV pairs:

* `light`: Number of operations on the lights.
* `air`: Number of operations on the fans.
* `water`: Number of operations on the pumps.
* `heater`: Number of operations on the heaters.
* `total`: Total operations.

### Query the statistics data

1. `GET /counter/daily`

An array with 7 elements. Each element is a daily counter of a day. The structures of each counter are as same as the main counter except an extra key named `date` which is an ISODate string indicates the date.

## Static HTTP Server

## Dedicated TCP Protocol

### Handshake

### Keep-alive

### Operate the flowerpot

## Running behind the Nginx reverse proxy
