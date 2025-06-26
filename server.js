const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

let messages = [];

app.post("/send", (req, res) => {
    const { sender, target, message } = req.body;
    if (!sender || !target || !message) return res.status(400).send("Bad request.");
    messages.push({ sender, target, message });
    res.send("Message queued");
});

app.get("/poll/:name", (req, res) => {
    const name = req.params.name;
    const result = messages.filter(msg => msg.target === name);
    messages = messages.filter(msg => msg.target !== name);
    res.json(result);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Relay server running on port ${PORT}`);
});
