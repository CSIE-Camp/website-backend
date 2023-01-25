const dotenv = require("dotenv")
dotenv.config()
const bcrypt = require("bcrypt")
const express = require("express")
const jwt = require("jsonwebtoken")

const { IsValidEmail, IsValidString, IsValidPassword } = require("../Modules/Validate")
const {FindAccountByEmail} = require("../Modules/Database")

const router = express.Router()

async function Login(email, password, ip){
    if (!(IsValidString(email) && IsValidString(password))){
        return {status: 400, data: "email or password cannot be null or empty!"}
    }
    if (!IsValidEmail(email)){
        return {status: 400, data: "Incorrect email or password!"}
    }
    if (!IsValidPassword(password)){
        return {status: 418, data: "I like green tea to be honest"} //Not a SHA512 string...Skid or Hacker
    }
    let Account = await FindAccountByEmail(email)
    if (!Account){
        return {status: 400, data: "Account does not exist!"}
    }
    try{
        let PassedCmp = await bcrypt.compare(password, Account.password)
        if (!PassedCmp){
            return {status: 400, data: "Invalid email or password!"}
        }
        return {status: 200, data: Account.id}
    }catch(error){
        console.log(error)
        return {status: 500, data: "Unexpected error occured! Please try again later"} 
    }
}

router.post("/", async (req, res) => {
    let ip = req.headers["x-forwarded-for"] || req.socket.remoteAddressw
    let email = req.body.email
    let password = req.body.password
    Login(email, password, ip).then(({status, data}) => {
        if (status !== 200){
            return res.status(status).json({message: data})
        }
        let token = jwt.sign({
            email: email,
            id: data
        }, process.env.JWT_SECRET, {algorithm: "HS512", expiresIn: "1h"})
        return res.status(status).json({
            message: "Authenticated!",
            token: token
        })
    }).catch((error) => {
        console.log(error)
        return res.status(500).json({message: "Internal Server Error!"})
    })
})

module.exports = router