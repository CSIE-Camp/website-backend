require("dotenv").config()
const Validate = require("./Validate.js")
const db = require("./Database.js")


const {timingSafeEqual} = require("crypto")
const bcrypt = require("bcrypt")

const SaltRounds = 14

const Sha512Regex = /[0-9a-fA-F]{128}$/

function IsString(string){
    return typeof string === "string" && string !== ""
}

function IsSha512(string){
    return Sha512Regex.test(string) && string.length === 128
}


async function Signup(Email, Password, ConfPassword, Ip){
    if (!(IsString(Email) && IsString(Password) && IsString(ConfPassword))){
        return {status: 418, data: "Email or password cannot be null or empty!"}
    }
    if (!Validate.ValidateEmail(Email)){
        return {status: 400, data: "Invalid email!"}
    }
    if (await db.FindAccountByEmail(Email)){
        return {status: 400, data: "Given email has been registered to an account! Log into that account instead!"}
    }
    
    if ((Password.length != ConfPassword.length) || !(IsSha512(Password) && IsSha512(ConfPassword))){ //Not a SHA512 string...Skid or Hacker
        return {status: 418, data: "I'm a teapot!"}
    }
    if (!timingSafeEqual(Buffer.from(Password), Buffer.from(ConfPassword))){
        console.log("Not the same")
        return {status: 400, data: "Invalid password!"}
    }
    try{
        let HashedPassword = await bcrypt.hash(Password, SaltRounds)
        let Status = await db.CreateAccount(Email, HashedPassword)
        if (!Status){
            return {status: 500, data: "Internal Server Error"}
        }
        console.log(Status)
        return {status: 200, data: "Account created!"}
    } catch(error){
        console.log(error)
        return {status: 500, data: "Unexpected error occured! Please try again later"}
    }
}

async function Login(email, password, ip){
    if (!(IsString(email) && IsString(password))){
        return {status: 400, data: "Email or password cannot be null or empty!"}
    }
    if (!Validate.ValidateEmail(email)){
        return {status: 400, data: "Incorrect email or password!"}
    }
    if (!IsSha512(password)){
        return {status: 418, data: "I like green tea to be honest"} //Not a SHA512 string...Skid or Hacker
    }
    let Account = await db.FindAccountByEmail(email)
    if (!Account){
        console.log("not exit")
        return {status: 400, data: "Account does not exist!"}
    }
    try{
        let PassCmp = await bcrypt.compare(password, Account.Password)
        if (!PassCmp){
            return {status: 400, data: "Incorrect email or password!"}
        }
        return {status: 200, data: {email: email, id: Account.id}}
    } catch (error){
        console.log(error)
        return {status: 500, data: "Unexpected error occured! Please try again later"} 
    }
}

async function UpdateProfile(){

}

async function RemoveAccount(Email, Password, ConfPassword, Ip){

}

module.exports = {
    Signup: Signup,
    Login: Login
}

