require("dotenv").config()

const validate = require("./api/validate/validate")
const user = require("./api/user/user")

const express = require("express")
const app = express()

app.use(express.urlencoded({extended: true}))
app.use(express.json())

app.post("/login", async (req, res) => {
    console.log(req.body)
    let CurrentUsr = req.user
    let ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress
    let email = req.body.email
    let password = req.body.password
    user.Login(email, password, ip).then(({status, message}) => {
        console.log(`status: ${status} | message: ${message}`)
        return res.status(200).send(message)
    }).catch((error) => {
        console.log(error)
        return res.status(500).send("Internal Server Error!")
    })
})

app.post("/signup", async (req, res) => {
    let ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress
    let email = req.body.email
    let password = req.body.password
    let conf_passowrd = req.body.conf_password
    user.signup(email, password, conf_password, ip).then(({status, message}) => {

    })
})

app.listen(process.env.PORT, () => {
    console.log(`Listening on Port ${process.env.PORT}`)
})

/*
Create account flow:

POST {email, password, confirm_password}to /signup
Verify email addr at with /api/v1/verify
click on sus link that redirects to /api/v1/verify/:id
if not verified then return error
if verified then redirect to account status page


*/