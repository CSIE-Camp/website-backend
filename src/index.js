const { PORT } = require("./config");

const express = require("express");
const swaggerUi = require("swagger-ui-express");
const path = require("path");
const yaml = require("yamljs");

const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use((req, res, next) => {
    const allowedOrigins = ["http://localhost", "http://localhost:3000", "https://camp.csie.cool"];

    const origin = req.headers.origin;
    if (allowedOrigins.includes(origin)) {
        res.setHeader("Access-Control-Allow-Origin", origin);
    }

    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    next();
});

const index = require("./routes/index");
const login = require("./routes/login");
const signup = require("./routes/signup");
const profile = require("./routes/profile");
const verification = require("./routes/verification");
const swaggerDocument = yaml.load("spec.yaml");

app.get("/", (req, res) => {
    return res.sendFile(path.join(__dirname, "index.html"));
});

app.use("/", index);
app.use("/login", login);
app.use("/signup", signup);
app.use("/profile", profile);
app.use("/verification", verification);
app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

//404 error
app.get("*", (req, res) => {
    const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
    console.log(ip);
    return res.status(404).send("URL not found!");
});

/*
hi, please put the send email code in ./Modules/EmailService, thanks
*/

app.listen(PORT, () => {
    console.log(`Listening on Port ${PORT}`);
});
