module.exports = function(RED) {
    let RemootioDevice = require('remootio-api-client');
    let remootioDoor;
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
        // this.remootio = config.remootio;

        this.log(ipaddress);
        remootioDoor = new RemootioDevice(
            ipaddress, //Device IP address
            apisecretkey, //API Secret Key
            apiauthkey, //API Auth Key

        //Constructor arguments:
        //The IP address of the device is available in the Remootio app once you set up Wi-Fi connectivity
        //The API Secret Key of the device is available in the Remootio app once you enable API access
        //The API Auth Key of the device is available in the Remootio app once you enable API access
        //Optional parameter here is how often the RemootioDevice class will send PING frames to the device to keep the connection alive (defaults to 60 seconds)    
        
        );

        remootioDoor.on('connecting',()=>{
            this.status({fill:"yellow",shape:"ring",text:"connecting"});
            this.warn('Remootio connecting ...')
        });

        remootioDoor.on('connected',()=>{
            this.warn('Remootio connected')
            this.status({fill:"green",shape:"ring",text:"connected"});
            remootioDoor.authenticate() //Authenticate the session (required)
        });

        remootioDoor.on('authenticated',()=>{
            this.warn('Remootio session authenticated')
            this.status({fill:"green",shape:"ring",text:"authenticated"});
            //From this point on actions (that require authentication) can be sent to Remootio
            //remootioDoor.sendQuery()
            //remootioDoor.sendTrigger()
            //remootioDoor.sendOpen()
            //remootioDoor.sendClose()
            //remootioDoor.sendRestart()
        });

            remootioDoor.connect(true); 

        var node = this;
        node.status({});

        remootioDoor.on('disconnect',()=>{
            this.status({fill:"red",shape:"ring",text:"disconnected"});
            this.warn('Remootio disconnected')
        });

        remootioDoor.on('error',(err)=>{
            this.status({fill:"red",shape:"ring",text:"error"});
            this.error('error',err)
        });

        remootioDoor.on('incomingmessage',(frame,decryptedPayload)=>{
            //log the incoming messages to the console
            this.log('Incoming message: ',frame)
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
                //this.log('Decrypted payload: ',decryptedPayload)
            }
            //messages can be handled here:
            //use frame.type to determine the frame type
            //if frame.type == "ENCRYPTED": 
            //then if decryptedPayload.response!=undefined it's a reponse message to an action sent previously
            //and if decryptedPayload.event!=undefined it's a log message e.g. gate status changed
        });

        remootioDoor.on('outgoingmessage',(frame, unencryptedPayload)=>{
            this.log('Outgoing message: ',frame)
            if (unencryptedPayload){
                //this.log('Unencrypted payload: ',unencryptedPayload)
            }
        });

        this.on('close', function(removed, done) {
            if (removed) {
                remootioDoor.disconnect();
            } else {
                remootioDoor.disconnect();
            }
            done();
        });
        
    }
    RED.nodes.registerType("events:remootio", RemootioStatusNode);

    function RemootioSwitch(config) {
        RED.nodes.createNode(this,config);
        // this.remootio = config.remootio;

        if (!remootioDoor){
            remootioDoor = new RemootioDevice(
                ipaddress, //Device IP address
                apisecretkey, //API Secret Key
                apiauthkey, //API Auth Key
    
            //Constructor arguments:
            //The IP address of the device is available in the Remootio app once you set up Wi-Fi connectivity
            //The API Secret Key of the device is available in the Remootio app once you enable API access
            //The API Auth Key of the device is available in the Remootio app once you enable API access
            //Optional parameter here is how often the RemootioDevice class will send PING frames to the device to keep the connection alive (defaults to 60 seconds)    
            
            );
        }

        remootioDoor.on('connecting',()=>{
            this.status({fill:"yellow",shape:"ring",text:"connecting"});
            this.warn('Remootio connecting ...')
        });

        remootioDoor.on('connected',()=>{
            this.warn('Remootio connected')
            this.status({fill:"green",shape:"ring",text:"connected"});
            remootioDoor.authenticate() //Authenticate the session (required)
        });

        remootioDoor.on('authenticated',()=>{
            this.warn('Remootio session authenticated')
            this.status({fill:"green",shape:"ring",text:"authenticated"});
            //From this point on actions (that require authentication) can be sent to Remootio
            //remootioDoor.sendQuery()
            //remootioDoor.sendTrigger()
            //remootioDoor.sendOpen()
            //remootioDoor.sendClose()
            //remootioDoor.sendRestart()
        });

        var node = this;        

        remootioDoor.on('disconnect',()=>{
            this.status({fill:"red",shape:"ring",text:"disconnected"});
            this.warn('Remootio disconnected')
        });

        remootioDoor.on('error',(err)=>{
            this.status({fill:"red",shape:"ring",text:"error"});
            this.error('error',err)
        });

        remootioDoor.on('outgoingmessage',(frame, unencryptedPayload)=>{
            this.log('Outgoing message: ',frame)
            if (unencryptedPayload){
                //this.log('Unencrypted payload: ',unencryptedPayload)
            }
        });

        this.on('input', function(msg, send, done) {
            if (!remootioDoor.isConnected && !remootioDoor.isAuthenticated){
                console.log("Remootio is not connected, connecting now");
               
                remootioDoor.connect(true); 
            }
            else {
                console.log("Remootio is connected - " + remootioDoor.isAuthenticated);
            }
               
                node.status({fill:"green",shape:"ring",text:"sent"});
            
        
            // If an error is hit, report it to the runtime
            // if (err) {
            //     if (done) {
            //         // Node-RED 1.0 compatible
            //         done(err);
            //     } else {
            //         // Node-RED 0.x compatible
            //         node.error(err, msg);
            //     }
            // }
        });

        this.on('close', function(removed, done) {
            if (removed) {
                remootioDoor.disconnect();
            } else {
                remootioDoor.disconnect();
            }
            done();
        });
        
    }
    RED.nodes.registerType("switch:remootio", RemootioSwitch);
}

