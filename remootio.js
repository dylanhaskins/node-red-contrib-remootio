module.exports = function (RED) {
    let RemootioDevice = require('remootio-api-client');
    let remootioStatus;
    let remootioSwitch = null;
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
            node.log('Remootio connecting ...')
        });

        remootioStatus.on('connected', () => {
            node.log('Remootio connected')
            node.status({ fill: "green", shape: "ring", text: "connected" });
            remootioSwitch = remootioStatus;
            sharedWebSocket = true;
            remootioStatus.authenticate() //Authenticate the session (required)
        });

        remootioStatus.on('disconnect', () => {
            node.status({ fill: "red", shape: "ring", text: "disconnected" });
            remootioSwitch = null;
            sharedWebSocket = false;
            node.log('Remootio disconnected')
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
        this.remootio = config.remootio
        this.remootioDevice = RED.nodes.getNode(this.remootio);
        this.command = config.remootiocommand
        this.status({});

        var node = this;

        node.on('input', function (msg, send, done) {

            if (remootioSwitch == null) {
                node.remootioSwitch = new RemootioDevice(
                    node.remootioDevice.ipaddress, //Device IP address
                    node.remootioDevice.apisecretkey, //API Secret Key
                    node.remootioDevice.apiauthkey, //API Auth Key
                );
                remootioSwitch = node.remootioSwitch
            }
            else {
                node.remootioSwitch = remootioSwitch;
            }

            if (!node.remootioSwitch.isConnected && !node.remootioSwitch.isAuthenticated) {
                node.remootioSwitch.connect();
            }
            else {
                doRemootioCommand(node, msg);
            }

            node.remootioSwitch.on('connecting', () => {
                node.status({ fill: "yellow", shape: "ring", text: "connecting" });
                node.log('Remootio connecting ...')
            });

            node.remootioSwitch.on('connected', () => {
                node.log('Remootio connected')
                node.status({ fill: "green", shape: "ring", text: "connected" });
                remootioSwitch = node.remootioSwitch;
                sharedWebSocket = true;
                node.remootioSwitch.authenticate() //Authenticate the session (required)
            });

            node.remootioSwitch.on('disconnect', () => {
                node.log('Remootio disconnected')
                remootioSwitch = null;
                sharedWebSocket = false;
            });

            node.remootioSwitch.on('authenticated', () => {
                node.log('Remootio session authenticated');
                node.status({ fill: "green", shape: "ring", text: "authenticated" });
                doRemootioCommand(node, msg);
                node.status({ fill: "green", shape: "ring", text: "sent" });
            });

            node.remootioSwitch.on('error', (err) => {
                node.status({ fill: "red", shape: "ring", text: "error" });
                node.error('error', err)
                node.remootioSwitch.disconnect();
            });

            node.send(msg);
        });

        node.on('close', function (removed, done) {
            if (removed) {
                if (node.remootioSwitch.isConnected()) {
                    node.remootioSwitch.disconnect();
                }
                if (remootioSwitch.isConnected()) {
                    remootioSwitch.disconnect();
                }
            } else {
                if (node.remootioSwitch.isConnected()) {
                    node.remootioSwitch.disconnect();
                }
                if (remootioSwitch.isConnected()) {
                    remootioSwitch.disconnect();
                }
            }
            done();
        });

    }

    function doRemootioCommand(node, msg) {
        node.log(node.command)
        switch (node.command) {
            case "sendPing":
                node.remootioSwitch.sendPing();
                node.log('Remootio sendPing sent');
                msg.topic = 'Remootio sendPing sent';
                node.status({ fill: "green", shape: "ring", text: "sent" });
                break;
            case "sendOpen":
                node.remootioSwitch.sendOpen();
                node.log('Remootio sendOpen sent');
                msg.topic = 'Remootio sendOpen sent';
                node.status({ fill: "green", shape: "ring", text: "sent" });
                break;
            case "sendClose":
                node.remootioSwitch.sendClose();
                node.log('Remootio sendClose sent');
                msg.topic = 'Remootio sendClose sent';
                node.status({ fill: "green", shape: "ring", text: "sent" });
                break;
            case "sendHello":
                node.remootioSwitch.sendHello();
                node.log('Remootio sendHello sent');
                msg.topic = 'Remootio sendHello sent';
                node.status({ fill: "green", shape: "ring", text: "sent" });
                break;
            case "sendQuery":
                node.remootioSwitch.sendQuery();
                node.log('Remootio sendQuery sent');
                msg.topic = 'Remootio sendQuery sent';
                node.status({ fill: "green", shape: "ring", text: "sent" });
                break;
            case "sendTrigger":
                node.remootioSwitch.sendTrigger();
                node.log('Remootio sendTrigger sent');
                msg.topic = 'Remootio sendTrigger sent';
                node.status({ fill: "green", shape: "ring", text: "sent" });
                break;
            case "sendRestart":
                node.remootioSwitch.sendRestart();
                node.log('Remootio sendRestart sent');
                msg.topic = 'Remootio sendRestart sent';
                node.status({ fill: "green", shape: "ring", text: "sent" });
                break;
            default:
        }
    }
    RED.nodes.registerType("switch: remootio", RemootioSwitch);
}

