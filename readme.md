node-red-remootio
=====================

<a href="http://nodered.org" target="_new">Node-RED</a> nodes to talk to <a href="https://www.remootio.com/">Remootio</a> using the <a href="https://github.com/remootio/remootio-api-documentation/blob/master/websocket_api_v3_specification.md">Remootio Websockets API </a>.

Install
-------

Run the following command in your Node-RED user directory - typically `~/.node-red`

        npm install node-red-remootio

Usage
-----

Provides three nodes - one to listen to events, one to send actions and a global configuration nodes `credentials: remootio` for Websocket credentials

### credentials: remootio

credentials: remootio is a global configuration node that contains the IP Address, API Secret Key and API Auth Key required to connect to your Remootio Device.

See <a href="https://github.com/remootio/remootio-api-documentation/blob/master/websocket_api_v3_specification.md#2-enabling-the-api">Enabling the API in the Remootio documentation. </a>

### events: remootio

events: remootio node, can be used to listen for Remootio events

#### Inputs

Takes a `credentials: remootio` input for authentication and connectivity to your Remootio device.

#### Outputs

When returning events it sets the `msg.payload.event` to the remootio event, a full list is documented by
<a href="https://github.com/remootio/remootio-api-documentation/blob/master/websocket_api_v3_specification.md#10-events-from-the-api" target="_new">Remootio</a>.

Sets `msg.payload.state` to the state of the event `open` or `closed`

Sets `msg.payload.type` to the type of the event : 
 - `StateChange`
 - `RelayTrigger`
 - `SecondaryRelayTrigger`
 - `OutputHeldActive`
 - `SecondaryOutputHeldActive`
 - `Connected`
 - `LeftOpen`
 - `KeyManagement`
 - `Restart`
 - `ManualButtonPushed`
 - `ManualButtonEnabled`
 - `ManualButtonDisabled`
 - `DoorbellPushed`
 - `DoorbellEnabled`
 - `SensorEnabled`
 - `SensorFlipped`
 - `SensorDisabled`

### switch: remootio

switch: remootio node, can be used to send command to your Remootio device

#### inputs 

Takes a `credentials: remootio` input for authentication and connectivity to your Remootio device.

Takes a command from a dropdown, available commands are : 
   - `sendPing`
   - `sendHello`
   - `sendQuery`
   - `sendTrigger`
   - `sendOpen`
   - `sendClose`
   - `sendRestart`

### Support

If you've found this useful and want to support my sleepless nights:

[![coffee](https://www.buymeacoffee.com/assets/img/custom_images/orange_img.png)](https://www.buymeacoffee.com/dylanhaskins)