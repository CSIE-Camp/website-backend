const { PORT } = require("./config");

const express = require("express");
const swaggerUi = require("swagger-ui-express");
const yaml = require("yamljs");

const app = express();

app.use(express.urlencoded({extended: true}));
app.use(express.json());

const index = require("./routes/index");
const login = require("./routes/login");
const signup = require("./routes/signup");
const verification = require("./routes/verification");
const swaggerDocument = yaml.load("spec.yaml");

app.use("/", index);
app.use("/login", login);
app.use("/signup", signup);
app.use("/verification", verification);
app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

//404 error
app.use((req, res, next) => {
	let ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
	console.log(ip);
	return res.status(404).send("URL not found");
});


/*
hi, please put the send email code in ./Modules/EmailService, thanks
*/

app.listen(PORT, () => {
	console.log(`Listening on Port ${PORT}`);
});

/*
Create account flow:
Verify email addr at with /api/v1/verify
click on sus link that redirects to /api/v1/verify/:id
if not verified then return error
if verified then redirect to account status page
*/
