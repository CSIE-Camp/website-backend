const { PORT } = require("./config");


const express = require("express");
const swaggerUi = require("swagger-ui-express");
const path = require("path");
const yaml = require("yamljs");

const app = express();

app.use(express.urlencoded({extended: true}));
app.use(express.json());

const index = require("./routes/index");
const login = require("./routes/login");
const admin = require("./routes/admin");
const signup = require("./routes/signup");
const profile = require("./routes/profile");
const verification = require("./routes/verification");
const swaggerDocument = yaml.load("spec.yaml");

app.get("/", (req, res) => {
	return res.sendFile(path.join(__dirname, "index.html"));
});

app.use("/", index);
app.use("/login", login);
app.use("/admin", admin);
app.use("/signup", signup);
app.use("/profile", profile);
app.use("/verification", verification);
app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

//404 error
app.get("*", (req, res) => {
	let ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
	console.log(ip);
	return res.status(404).send("URL not found!");
});

app.listen(PORT, () => {
	console.log(`Listening on Port ${PORT}`);
});
