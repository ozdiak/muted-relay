const express = require("express");
const Filter = require("bad-words-plus");
const app = express();
const PORT = process.env.PORT || 3000;

const filter = new Filter({ firstLetter: true });

filter.removeWords("ass", "butt", "damn", "shit", "piss", "suck", "", "");
filter.addWords("ip", "address", "i.p", "i p");

app.use(express.json());

let messages = {};
let waitingClients = {};

// === POST /send ===
app.post("/send", (req, res) => {
    const { sender, target, message } = req.body;
    if (!sender || !target || !message) {
        return res.status(400).send("Missing sender, target, or message");
    }

const filtered = filter.clean(message); 
const formattedText = `[muted] ${sender} » ${filtered}`;

    if (!messages[target]) messages[target] = [];
messages[target].push({ sender, message: filtered, formattedText });

    if (waitingClients[target]?.length) {
        waitingClients[target].forEach(clientRes => clientRes.json(messages[target]));
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
        if (!waitingClients[receiver]) waitingClients[receiver] = [];
        waitingClients[receiver].push(res);

        setTimeout(() => {
            const ix = waitingClients[receiver].indexOf(res);
            if (ix !== -1) {
                waitingClients[receiver].splice(ix, 1);
                res.json([]); // no messages
            }
        }, 2000);
    }
});


app.get("/", (req, res) => {
    res.send("Relay server online.");
});

// === Start server ===
app.listen(PORT, () => {
    console.log(`Relay server running on port ${PORT}`);
});
