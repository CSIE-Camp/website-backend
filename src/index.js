require("dotenv").config()
const Account = require("./Modules/Account")

const express = require("express")
const jwt = require("jsonwebtoken")

const app = express()

app.use(express.urlencoded({extended: true}))
app.use(express.json())

const login = require("./routes/login")
const signup = require("./routes/signup")
const verification = require("./routes/verification")

app.use("/login", login)
app.use("/signup", signup)
app.use("/verification", verification)

function EnsureTokenExists(req, res, next){
    let BearerHeader = req.headers["authorization"]
    let token = BearerHeader && BearerHeader.split(" ")[1]
    if (!token){
        return res.status(401).json({message: "Token = null?"})
    }
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err){
            return res.status(403).json({message: "Invalid Auth token"})
        }
        req.user = user
        next()
    })
}

app.post("/api/v1/profile", EnsureTokenExists, async (req, res) => {

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