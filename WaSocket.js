const BinaryCoding = require('./binary/binary_encoder.js')

class WhatsAppWeb {

	static version = [0,4,1296] 
	static browserDescriptions = ["WaSocket", "WaSocket"]

	static Status = {
		notConnected: 0,
		connecting: 1,
		creatingNewConnection: 3,
		loggingIn: 4,
		connected: 5
	}
	
	
	static Presence = {
		available: "available", // "online"
		unavailable: "unavailable", // offline
		composing: "composing", // "typing..."
		recording: "recording", // "recording..."
		paused: "paused"
	}

	constructor() {
		this.conn = null // ws connection

		this.authInfo = null // auth connection & restore

		this.userMetaData = null // metadata user
		this.chats = {} // all chats of the user, mapped by the user ID
		this.handlers = {} // data for the event handlers
		this.msgCount = 0 // number of messages sent to the server; required field for sending messages etc.
		this.autoReconnect = true // reconnect automatically after an unexpected disconnect
		this.lastSeen = null // updated by sending a keep alive request to the server, and the server responds with our updated last seen

		this.queryCallbacks = []

		this.encoder = new BinaryCoding.Encoder()
		this.decoder = new BinaryCoding.Decoder()

		this.status = WhatsAppWeb.Status.notConnected
	}
	// error is a json array: [errorCode, "error description", optionalDescription]
	gotError (error) {
		this.handlers.onError(error) // tell the handler, we got an error
	}
	// called when established a connection to the WhatsApp servers successfully
	didConnectSuccessfully () {
		console.log("connected successfully")

		this.status = WhatsAppWeb.Status.connected // update our status
		this.lastSeen = new Date() // set last seen to right now
		this.startKeepAliveRequest() // start sending keep alive requests (keeps the WebSocket alive & updates our last seen)

		if (this.reconnectLoop) { // if we connected after being disconnected
			clearInterval(this.reconnectLoop) // kill the loop to reconnect us
		} else { // if we connected for the first time, i.e. not after being disconnected
			if (this.handlers.onConnected) // tell the handler that we're connected
				this.handlers.onConnected()
		}
	}
	// base 64 encode the authentication credentials and return them, these can then be saved used to login again
	// see login () in WhatsAppWeb.Session
	base64EncodedAuthInfo () {
		return {
			clientID: this.authInfo.clientID,
			serverToken: this.authInfo.serverToken,
			clientToken: this.authInfo.clientToken,
			encKey: this.authInfo.encKey.toString('base64'),
			macKey: this.authInfo.macKey.toString('base64')
		}
	}
}

/* import the rest of the code */
require("./WaSocket.Session.js")(WhatsAppWeb)
require("./WaSocket.Recv.js")(WhatsAppWeb)
require("./WaSocket.Send.js")(WhatsAppWeb)

module.exports = WhatsAppWeb
