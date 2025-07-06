const express = require("express");
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

let messages = {}; // { receiverName: [ {sender, message} ] }
let waitingClients = {}; // { receiverName: [ res, ... ] }

app.post("/send", (req, res) => {
    const { sender, target, message } = req.body;
    if (!sender || !target || !message) {
        return res.status(400).send("Missing sender, target, or message");
    }

    if (!messages[target]) messages[target] = [];
    messages[target].push({ sender, message });

    // If client(s) are waiting, send message immediately
    if (waitingClients[target] && waitingClients[target].length > 0) {
        waitingClients[target].forEach(clientRes => {
            clientRes.json(messages[target]);
        });
        waitingClients[target] = [];
        messages[target] = [];
    }

    res.send("OK");
});

app.get("/poll/:receiver", (req, res) => {
    const receiver = req.params.receiver;
    if (!messages[receiver]) messages[receiver] = [];

    if (messages[receiver].length > 0) {
        const userMessages = messages[receiver];
        messages[receiver] = [];
        res.json(userMessages);
    } else {
        // No messages: hold connection open up to 10 seconds
        if (!waitingClients[receiver]) waitingClients[receiver] = [];
        waitingClients[receiver].push(res);

        // Timeout to end the request after 10 seconds if no messages arrive
        setTimeout(() => {
            const index = waitingClients[receiver].indexOf(res);
            if (index !== -1) {
                waitingClients[receiver].splice(index, 1);
                res.json([]); // no messages
            }
        }, 10000);
    }
});

app.get("/", (req, res) => {
    res.send("Relay server online.");
});

app.listen(PORT, () => {
    console.log(`Relay server running on port ${PORT}`);
});
