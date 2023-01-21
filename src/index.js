require("dotenv").config()
const Account = require("./Modules/Account")

const express = require("express")
const app = express()

app.use(express.urlencoded({extended: true}))
app.use(express.json())

app.post("/login", async (req, res) => {
    let CurrentUsr = req.user
    let Ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress
    let Email = req.body.email
    let Password = req.body.password
    Account.Login(Email, Password, Ip).then(({ status, message }) => {
        if (status != 200) {
            console.log(`Failed: ${message}`)
            return res.status(status).send(message)
        }
        console.log(`${Email} Logged in successfully!`)
        return res.status(status).send(message)
    }).catch((error) => {
        console.log(error)
        return res.status(500).send("Internal Server Error")
    })
})

app.post("/signup", async (req, res) => {
    let ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress
    let email = req.body.email
    let password = req.body.password
    let conf_password = req.body.conf_password
    console.log(`Email: ${email} | Password: ${password} | Conf_Pasword: ${conf_password}`)
    Account.Signup(email, password, conf_password, ip).then(({status, message}) => {
        if (status != 200){
            return res.status(status).send(message)
        }
        console.log(`${email} : Account created!}`)
        return res.status(status).send(message)
    }).catch((error) => {
        console.log(error)
        return res.status(500).send("Internal Server Error")
    })
})

app.post("/api/v1/verify/:id", async (req, res) => {
    //email verification
})

app.listen(process.env.PORT, () => {
    console.log(`Listening on Port ${process.env.PORT}`)
})

/*
Create account flow:

Verify email addr at with /api/v1/verify
click on sus link that redirects to /api/v1/verify/:id
if not verified then return error
if verified then redirect to account status page


*/