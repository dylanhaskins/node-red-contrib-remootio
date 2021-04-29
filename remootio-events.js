module.exports = function(RED) {
    let RemootioDevice = require('remootio-api-client');
    let garagedoor1;
    let ipaddress;
    let apisecretkey;
    let apiauthkey;

    function RemootioCredentialsNode(config){
        RED.nodes.createNode(this,config);
        ipaddress = config.ipaddress;
        apisecretkey = this.credentials.apisecretkey;
        apiauthkey = this.credentials.apiauthkey;

    }
        RED.nodes.registerType("credentials:remootio",RemootioCredentialsNode,{
            credentials: {
                ipaddress : {type:"text"},
                apisecretkey: {type:"password"},
                apiauthkey: {type:"password"}
             }
        });

    function RemootioStatusNode(config) {
        RED.nodes.createNode(this,config);
        this.remootio = config.remootio;

        console.log(ipaddress);
        garagedoor1 = new RemootioDevice(
            ipaddress, //Device IP address
            apisecretkey, //API Secret Key
            apiauthkey, //API Auth Key

        //Constructor arguments:
        //The IP address of the device is available in the Remootio app once you set up Wi-Fi connectivity
        //The API Secret Key of the device is available in the Remootio app once you enable API access
        //The API Auth Key of the device is available in the Remootio app once you enable API access
        //Optional parameter here is how often the RemootioDevice class will send PING frames to the device to keep the connection alive (defaults to 60 seconds)    
        
        );

        garagedoor1.on('connecting',()=>{
            this.status({fill:"yellow",shape:"ring",text:"connecting"});
            console.log('garage door 1 connecting ...')
        });

        garagedoor1.on('connected',()=>{
            console.log('garage door 1 connected')
            this.status({fill:"green",shape:"ring",text:"connected"});
            garagedoor1.authenticate() //Authenticate the session (required)
        });

        garagedoor1.on('authenticated',()=>{
            console.log('garage door 1 session authenticated')
            this.status({fill:"green",shape:"ring",text:"authenticated"});
            //From this point on actions (that require authentication) can be sent to Remootio
            //garagedoor1.sendQuery()
            //garagedoor1.sendTrigger()
            //garagedoor1.sendOpen()
            //garagedoor1.sendClose()
            //garagedoor1.sendRestart()
        });

            garagedoor1.connect(true); 

        var node = this;
        node.status({});

        garagedoor1.on('disconnect',()=>{
            this.status({fill:"red",shape:"ring",text:"disconnected"});
            console.log('garage door 1 disconnected')
        });

        garagedoor1.on('error',(err)=>{
            this.status({fill:"red",shape:"ring",text:"error"});
            console.log('error',err)
        });

        garagedoor1.on('incomingmessage',(frame,decryptedPayload)=>{
            //log the incoming messages to the console
            console.log('Incoming message: ',frame)
            if (decryptedPayload){
                if (decryptedPayload.event && decryptedPayload.event.state) {
                    switch (decryptedPayload.event.state){
                        case "open" :
                            this.status({fill:"red",shape:"ring",text:"open"});
                            var thePayload = {state: decryptedPayload.event.state, type: decryptedPayload.event.type, fullevent: decryptedPayload.event};
                            var msg = { payload: thePayload}
                            this.send(msg);
                            break;
                        case "closed" :
                            var thePayload = {state: decryptedPayload.event.state, type: decryptedPayload.event.type, fullevent: decryptedPayload.event};
                            var msg = { payload: thePayload}
                            this.send(msg)
                            break;
                        default : 
                            this.status({fill:"yellow",shape:"ring",text:decryptedPayload.event.state});
                            var thePayload = {state: decryptedPayload.event.state, type: decryptedPayload.event.type, fullevent: decryptedPayload.event};
                            var msg = { payload: thePayload}
                            this.send(msg)
                    }
            }
                //console.log('Decrypted payload: ',decryptedPayload)
            }
            //messages can be handled here:
            //use frame.type to determine the frame type
            //if frame.type == "ENCRYPTED": 
            //then if decryptedPayload.response!=undefined it's a reponse message to an action sent previously
            //and if decryptedPayload.event!=undefined it's a log message e.g. gate status changed
        });

        // garagedoor1.on('outgoingmessage',(frame, unencryptedPayload)=>{
        //     console.log('Outgoing message: ',frame)
        //     if (unencryptedPayload){
        //         console.log('Unencrypted payload: ',unencryptedPayload)
        //     }
        // });

        // garagedoor1.connect(true); 
        //var msg = { payload:garagedoor1.isConnected() }
        //this.send(msg);

        this.on('close', function(removed, done) {
            if (removed) {

            } else {
                // This node is being restarted
            }
            done();
        });
        
    }
    RED.nodes.registerType("events:remootio", RemootioStatusNode);
}

