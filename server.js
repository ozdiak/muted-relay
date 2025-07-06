const express = require("express");
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

let messages = {};
let waitingClients = {};

function filterMessage(message) {
    const curseWords = [
        "asshole", "bastard", "bitch", "boner", "cock",
        "cunt", "cum", "dick", "dildo", "die", "douche",
        "fag", "faggot", "fuck", "gay", "hitler", "kill yourself", "kms",
        "kys", "nazi", "nigger", "nude", "penis", "piss", "porn", "prick",
        "pussy", "rape", "retard", "sex", "slut", "suicide", "twat",
        "vagina", "whore", "ip", "bitchass", "nigga", "niga", "nigg",
        "nig", "cumface", "suck balls", "suck ballz"
    ];
    const regex = new RegExp(`\\b(${curseWords.join("|")})\\b`, "gi");
    return message.replace(regex, m => m[0] + "*".repeat(m.length - 1));
}

app.post("/send", (req, res) => {
    const { sender, target, message } = req.body;
    if (!sender || !target || !message) {
        return res.status(400).send("Missing sender, target, or message");
    }

    const filtered = filterMessage(message);
    const formatted = `[muted] ${sender} » ${filtered}`;

    if (!messages[target]) messages[target] = [];
    messages[target].push({ formatted });

    if (waitingClients[target]?.length) {
        waitingClients[target].forEach(r => r.json(messages[target]));
        waitingClients[target] = [];
        messages[target] = [];
    }

    res.send("OK");
});

app.get("/poll/:receiver", (req, res) => {
    const rec = req.params.receiver;
    if (!messages[rec]) messages[rec] = [];

    if (messages[rec].length > 0) {
        const out = messages[rec];
        messages[rec] = [];
        res.json(out);
    } else {
        if (!waitingClients[rec]) waitingClients[rec] = [];
        waitingClients[rec].push(res);
        setTimeout(() => {
            const idx = waitingClients[rec].indexOf(res);
            if (idx > -1) {
                waitingClients[rec].splice(idx, 1);
                res.json([]);
            }
        }, 10000);
    }
});

app.get("/", (req, res) => res.send("Relay server online."));
app.listen(PORT, () => console.log(`Running on port ${PORT}`));
