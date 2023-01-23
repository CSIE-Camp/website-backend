require("dotenv").config()
const Account = require("./Modules/Account")

const express = require("express")
const jwt = require("jsonwebtoken")

const app = express()

app.use(express.urlencoded({extended: true}))
app.use(express.json())

function EnsureTokenExists(req, res, next){
    let BearerHeader = req.headers["authorization"]
    if (typeof BearerHeader === "undefiend"){
        return res.status(403)
    }
    let Token = BearerHeader.split(" ")[1]
    req.token = Token
    next()
}

app.post("/login", async (req, res) => {
    let Ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress
    let Email = req.body.email
    let Password = req.body.password
    Account.Login(Email, Password, Ip).then(({ status, data }) => {
        if (status != 200) {
            console.log(`Failed: ${data}`)
            return res.status(status).json({message: data})
        }
        let token = jwt.sign({
            data: data
        }, process.env.JWT_SECRET, {algorithm: "HS512" ,expiresIn: "24h"})
        console.log(`${Email} Logged in successfully!`)
        return res.status(status).json({
            message: "Logged in!",
            token: token
        })
    }).catch((error) => {
        console.log(error)
        return res.status(500).json({message: "Internal Server Error"})
    })
})

app.post("/signup", async (req, res) => {
    let ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress
    let email = req.body.email
    let password = req.body.password
    let conf_password = req.body.conf_password
    console.log(`Email: ${email} | Password: ${password} | Conf_Pasword: ${conf_password}`)
    Account.Signup(email, password, conf_password, ip).then(({status, data}) => {
        if (status != 200){
            return res.status(status).json({message: data})
        }
        console.log(`${email} : Account created!}`)
        return res.status(status).json({message: data})
    }).catch((error) => {
        console.log(error)
        return res.status(500).json({message: "Internal server Error"})
    })
})

app.post("/api/v1/profile", EnsureTokenExists, async (req, res) => {

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