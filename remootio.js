module.exports = function (RED) {
    let RemootioDevice = require('remootio-api-client');
    let remootioStatus;
    let remootioSwitch;
    // let ipaddress;
    // let apisecretkey;
    // let apiauthkey;
    let remootioCommand;
    let sharedWebSocket = false;

    function RemootioCredentialsNode(config) {
        RED.nodes.createNode(this, config);
        this.ipaddress = config.ipaddress;
        this.apisecretkey = this.credentials.apisecretkey;
        this.apiauthkey = this.credentials.apiauthkey;

    }
    RED.nodes.registerType("credentials: remootio", RemootioCredentialsNode, {
        credentials: {
            ipaddress: { type: "text" },
            apisecretkey: { type: "password" },
            apiauthkey: { type: "password" }
        }
    });

    function RemootioStatusNode(config) {
        RED.nodes.createNode(this, config);
        this.remootioDevice = RED.nodes.getNode(config.remootio);

        var node = this;
        node.status({});
        
        remootioStatus = new RemootioDevice(
            node.remootioDevice.ipaddress, //Device IP address
            node.remootioDevice.apisecretkey, //API Secret Key
            node.remootioDevice.apiauthkey, //API Auth Key

            //Constructor arguments:
            //The IP address of the device is available in the Remootio app once you set up Wi-Fi connectivity
            //The API Secret Key of the device is available in the Remootio app once you enable API access
            //The API Auth Key of the device is available in the Remootio app once you enable API access
            //Optional parameter here is how often the RemootioDevice class will send PING frames to the device to keep the connection alive (defaults to 60 seconds)    

        );

        remootioStatus.on('connecting', () => {
            node.status({ fill: "yellow", shape: "ring", text: "connecting" });
            node.warn('Remootio connecting ...')
        });

        remootioStatus.on('connected', () => {
            node.warn('Remootio connected')
            node.status({ fill: "green", shape: "ring", text: "connected" });
            remootioSwitch = remootioStatus;
            sharedWebSocket = true;
            remootioStatus.authenticate() //Authenticate the session (required)
        });

        remootioStatus.on('disconnect', () => {
            node.status({ fill: "red", shape: "ring", text: "disconnected" });
            node.warn('Remootio disconnected')
        });

        remootioStatus.on('error', (err) => {
            node.status({ fill: "red", shape: "ring", text: "error" });
            console.log(err);
            node.error('error', err)
        });

        remootioStatus.on('incomingmessage', (frame, decryptedPayload) => {
            if (decryptedPayload) {
                if (decryptedPayload.event && decryptedPayload.event.state) {
                    switch (decryptedPayload.event.state) {
                        case "open":
                            node.status({ fill: "red", shape: "ring", text: "open" });
                            var thePayload = { state: decryptedPayload.event.state, type: decryptedPayload.event.type, event: decryptedPayload.event };
                            var msg = { payload: thePayload }
                            node.send(msg);
                            break;
                        case "closed":
                            node.status({ fill: "green", shape: "ring", text: "closed" });
                            var thePayload = { state: decryptedPayload.event.state, type: decryptedPayload.event.type, event: decryptedPayload.event };
                            var msg = { payload: thePayload }
                            node.send(msg)
                            break;
                        default:
                            node.status({ fill: "yellow", shape: "ring", text: decryptedPayload.event.state });
                            var thePayload = { state: decryptedPayload.event.state, type: decryptedPayload.event.type, event: decryptedPayload.event };
                            var msg = { payload: thePayload };
                            node.send(msg);
                    }
                }
            }
        });

        remootioStatus.connect(true);

        node.on('close', function (removed, done) {
            if (removed) {
                remootioStatus.disconnect();
            } else {
                remootioStatus.disconnect();
            }
            done();
        });

    }
    RED.nodes.registerType("events: remootio", RemootioStatusNode);

    function RemootioSwitch(config) {
        RED.nodes.createNode(this, config);
        this.remootioDevice = RED.nodes.getNode(config.remootio);
        var node = this;
        node.status({});

        node.remootiocommand = config.remootiocommand;
        remootioCommand = node.remootiocommand;
        if (!remootioSwitch) {
            remootioSwitch = new RemootioDevice(
                node.remootioDevice.ipaddress, //Device IP address
                node.remootioDevice.apisecretkey, //API Secret Key
                node.remootioDevice.apiauthkey, //API Auth Key
            );
        }

        remootioSwitch.on('connecting', () => {
            node.status({ fill: "yellow", shape: "ring", text: "connecting" });
            node.warn('Remootio connecting ...')
        });

        remootioSwitch.on('connected', () => {
            node.warn('Remootio connected')
            node.status({ fill: "green", shape: "ring", text: "connected" });
            remootioSwitch.authenticate() //Authenticate the session (required)
        });

        remootioSwitch.on('disconnect', () => {
            node.warn('Remootio disconnected')
        });

        remootioSwitch.on('authenticated', () => {
            node.warn('Remootio session authenticated');            
            node.status({ fill: "green", shape: "ring", text: "authenticated" });
            doRemootioCommand(node);
            node.status({ fill: "green", shape: "ring", text: "sent" });
        });

        remootioSwitch.on('error', (err) => {
            node.status({ fill: "red", shape: "ring", text: "error" });
            node.error('error', err)
            remootioSwitch.disconnect();
        });

        node.on('input', function (msg, send, done) {
            if (!remootioSwitch.isConnected && !remootioSwitch.isAuthenticated) {
                remootioSwitch.connect();
            }
            else {
                doRemootioCommand(node);
            }
        });

        node.on('close', function (removed, done) {
            if (removed) {
                if (remootioSwitch.isConnected()) {
                    remootioSwitch.disconnect();
                }
            } else {
                if (remootioSwitch.isConnected()) {
                    remootioSwitch.disconnect();
                }
            }
            done();
        });

    }

    function doRemootioCommand(node) {
        switch (remootioCommand) {
            case "sendPing":
                remootioSwitch.sendPing();
                node.warn('Remootio sendPing sent');
                node.status({ fill: "green", shape: "ring", text: "sent" });
                if (!sharedWebSocket) {
                    remootioSwitch.disconnect();
                }
                break;
            case "sendOpen":
                remootioSwitch.sendOpen();
                node.warn('Remootio sendOpen sent');
                node.status({ fill: "green", shape: "ring", text: "sent" });
                if (!sharedWebSocket) {
                    remootioSwitch.disconnect();
                }
                break;
            case "sendClose":
                remootioSwitch.sendClose();
                node.warn('Remootio sendClose sent');
                node.status({ fill: "green", shape: "ring", text: "sent" });
                if (!sharedWebSocket) {
                    remootioSwitch.disconnect();
                }
                break;
            case "sendHello":
                remootioSwitch.sendHello();
                node.warn('Remootio sendHello sent');
                node.status({ fill: "green", shape: "ring", text: "sent" });
                if (!sharedWebSocket) {
                    remootioSwitch.disconnect();
                }
                break;
            case "sendQuery":
                remootioSwitch.sendQuery();
                node.warn('Remootio sendQuery sent');
                node.status({ fill: "green", shape: "ring", text: "sent" });
                if (!sharedWebSocket) {
                    remootioSwitch.disconnect();
                }
                break;
            case "sendTrigger":
                remootioSwitch.sendTrigger();
                node.warn('Remootio sendTrigger sent');
                node.status({ fill: "green", shape: "ring", text: "sent" });
                if (!sharedWebSocket) {
                    remootioSwitch.disconnect();
                }
                break;
            case "sendRestart":
                remootioSwitch.sendRestart();
                node.warn('Remootio sendRestart sent');
                node.status({ fill: "green", shape: "ring", text: "sent" });
                if (!sharedWebSocket) {
                    remootioSwitch.disconnect();
                }
                break;
            default:
                if (!sharedWebSocket) {
                    remootioSwitch.disconnect();
                }
        }
    }
    RED.nodes.registerType("switch: remootio", RemootioSwitch);
}

