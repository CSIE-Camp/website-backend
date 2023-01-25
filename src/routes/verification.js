const dotenv = require("dotenv")
dotenv.config()

const express = require("express")
const jwt = require("jsonwebtoken")

const {VerifyPendingAccount} = require("./../Modules/Database")

const router = express.Router()


router.get("/verify-email/:token", async (req, res) => {
    let ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress
    let token = req.params.token
    if (!token){
        return res.status(403).json({message: "Invalid token"})
    }
    
})


module.exports = router
