module.exports = function (RED) {
    let RemootioDevice = require('remootio-api-client');

    function RemootioCredentialsNode(config) {
        RED.nodes.createNode(this, config);
        this.ipaddress = config.ipaddress;
        this.apisecretkey = this.credentials.apisecretkey;
        this.apiauthkey = this.credentials.apiauthkey;

        this.log("Connecting to Remootio Device @ " + this.ipaddress);
        this.connectedRemootio = new RemootioDevice(
            this.ipaddress,
            this.apisecretkey,
            this.apiauthkey
        );

        this.connectedRemootio.on('connecting', () => {
            this.log('Remootio ' + this.ipaddress + ' connecting ...');
        });

        this.connectedRemootio.on('connected', () => {
            this.log('Remootio ' + this.ipaddress + ' connected');
            this.connectedRemootio.authenticate() //Authenticate the session (required)
        });

        this.connectedRemootio.on('authenticated', () => {
            this.log('Remootio ' + this.ipaddress + ' authenticated');
        });

        this.connectedRemootio.on('disconnect', () => {
            this.log('Remootio ' + this.ipaddress + ' disconnected');
        });

        this.connectedRemootio.connect(true);

        this.on('close', function(removed, done) {
            if (removed) {
                // This node has been disabled/deleted
            } else {
                this.connectedRemootio.disconnect();
            }
            done();
        });
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
        node.remootioStatus = this.remootioDevice.connectedRemootio;

        node.remootioStatus.on('connecting', () => {
            node.status({ fill: "yellow", shape: "ring", text: "connecting" });
        });

        node.remootioStatus.on('connected', () => {
            node.status({ fill: "green", shape: "ring", text: "connected" });
        });

        node.remootioStatus.on('disconnect', () => {
            node.status({ fill: "red", shape: "ring", text: "disconnected" });
        });

        node.remootioStatus.on('error', (err) => {
            node.status({ fill: "red", shape: "ring", text: "error" });
            console.log(err);
            node.error('error', err);
        });

        node.remootioStatus.on('incomingmessage', (frame, decryptedPayload) => {
            if (decryptedPayload) {
                if (decryptedPayload.event && decryptedPayload.event.state) {
                    switch (decryptedPayload.event.state) {
                        case "open":
                            node.status({ fill: "red", shape: "ring", text: "open" });
                            var thePayload = { state: decryptedPayload.event.state, type: decryptedPayload.event.type, event: decryptedPayload.event };
                            var msg = { payload: thePayload };
                            node.send(msg);
                            break;
                        case "closed":
                            node.status({ fill: "green", shape: "ring", text: "closed" });
                            var thePayload = { state: decryptedPayload.event.state, type: decryptedPayload.event.type, event: decryptedPayload.event };
                            var msg = { payload: thePayload }
                            node.send(msg);
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
    }

    RED.nodes.registerType("events: remootio", RemootioStatusNode);

    function RemootioSwitch(config) {
        RED.nodes.createNode(this, config);
        this.remootio = config.remootio;
        this.remootioDevice = RED.nodes.getNode(this.remootio);
        this.command = config.remootiocommand;
        this.ipaddress = this.remootioDevice.ipaddress;
        this.status({});

        var node = this;

        node.on('input', function (msg, send, done) {
            node.remootioSwitch = this.remootioDevice.connectedRemootio;

            if (!node.remootioSwitch.isConnected && !node.remootioSwitch.isAuthenticated) {
                node.remootioSwitch.connect();
            }
            else {
                doRemootioCommand(node, msg);
            }

            node.remootioSwitch.on('error', (err) => {
                node.status({ fill: "red", shape: "ring", text: "error" });
                node.error('error', err);
                node.remootioSwitch.disconnect();
            });

            node.send(msg);

            if (done) {
                done();
            }
        });
    }

    function doRemootioCommand(node, msg) {
        switch (node.command) {
            case "sendPing":
                node.remootioSwitch.sendPing();
                node.log('Remootio sendPing sent to ' + node.ipaddress);
                msg.topic = 'Remootio sendPing sent';
                node.status({ fill: "green", shape: "ring", text: "sent" });
                break;
            case "sendOpen":
                node.remootioSwitch.sendOpen();
                node.log('Remootio sendOpen sent to ' + node.ipaddress);
                msg.topic = 'Remootio sendOpen sent';
                node.status({ fill: "green", shape: "ring", text: "sent" });
                break;
            case "sendClose":
                node.remootioSwitch.sendClose();
                node.log('Remootio sendClose sent to ' + node.ipaddress);
                msg.topic = 'Remootio sendClose sent';
                node.status({ fill: "green", shape: "ring", text: "sent" });
                break;
            case "sendHello":
                node.remootioSwitch.sendHello();
                node.log('Remootio sendHello sent to ' + node.ipaddress);
                msg.topic = 'Remootio sendHello sent';
                node.status({ fill: "green", shape: "ring", text: "sent" });
                break;
            case "sendQuery":
                node.remootioSwitch.sendQuery();
                node.log('Remootio sendQuery sent to ' + node.ipaddress);
                msg.topic = 'Remootio sendQuery sent';
                node.status({ fill: "green", shape: "ring", text: "sent" });
                break;
            case "sendTrigger":
                node.remootioSwitch.sendTrigger();
                node.log('Remootio sendTrigger sent to ' + node.ipaddress);
                msg.topic = 'Remootio sendTrigger sent';
                node.status({ fill: "green", shape: "ring", text: "sent" });
                break;
            case "sendRestart":
                node.remootioSwitch.sendRestart();
                node.log('Remootio sendRestart sent to ' + node.ipaddress);
                msg.topic = 'Remootio sendRestart sent';
                node.status({ fill: "green", shape: "ring", text: "sent" });
                break;
            default:
        }
    }
    RED.nodes.registerType("switch: remootio", RemootioSwitch);
}

