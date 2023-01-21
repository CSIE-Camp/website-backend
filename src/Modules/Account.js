const Validate = require("./Validate.js")
const db = require("./Database.js")

const {timingSafeEqual} = require("crypto")
const bcrypt = require("bcrypt")

const SaltRounds = 14

const Sha512Regex = /[0-9a-fA-F]{128}$/

function IsString(string){
    return typeof string == "string" && string != ""
}

function IsSha512(string){
    return Sha512Regex.test(string) && string.length == 128
}

async function Signup(Email, Password, ConfPassword, Ip){
    if (!(IsString(Email) && IsString(Password) && IsString(ConfPassword))){
        return {status: 418, message: "Email or password cannot be null or empty!"}
    }
    if (!Validate.ValidateEmail(Email)){
        return {status: 400, message: "Invalid email!"}
    }
    if (await db.FindAccount(Email)){
        return {status: 400, message: "Given email has been registered to an account! Log into that account instead!"}
    }
    
    if ((Password.length != ConfPassword.length) || !(IsSha512(Password) && IsSha512(ConfPassword))){ //Not a SHA512 string...Skid or Hacker
        return {status: 418, message: "I'm a teapot!"}
    }
    if (!timingSafeEqual(Buffer.from(Password), Buffer.from(ConfPassword))){
        console.log("Not the same")
        return {status: 400, message: "Invalid password!"}
    }
    try{
        let HashedPassword = await bcrypt.hash(Password, SaltRounds)
        let Status = await db.CreateAccount(Email, HashedPassword)
        if (!Status){
            return {status: 500, message: "Internal Server Error"}
        }
        console.log(Status)
        return {status: 200, message: "Account created!"}
    } catch(error){
        console.log(error)
        return {status: 500, message: "Unexpected error occured! Please try again later"}
    }
}

async function Login(email, password, ip){
    if (!(IsString(email) && IsString(password))){
        return {status: 400, message: "Email or password cannot be null or empty!"}
    }
    if (!Validate.ValidateEmail(email)){
        return {status: 400, message: "Incorrect email or password!"}
    }
    if (!IsSha512(password)){
        return {status: 418, message: "I like green tea to be honest"} //Not a SHA512 string...Skid or Hacker
    }
    const Account = await db.FindAccount(email)
    if (!Account){
        console.log("not exit")
        return {status: 400, message: "Account does not exist!"}
    }
    try{
        const PassCmp = await bcrypt.compare(password, Account.Password)
        if (!PassCmp){
            console.log(`[${ip}] Account: ${email} | Incorrect password !`) //Remove in prod?
            return {status: 400, message: "Incorrect email or password!"}
        }
        console.log(`[${ip}] Account: ${email} | Logged in successfully!`) //Remove in prod?
        return {status: 200, message: "Logged in successfully"}
    } catch (error){
        console.log(error)
        return {status: 500, message: "Unexpected error occured! Please try again later"} 
    }
}

async function UpdateProfile(){
    
}

module.exports = {
    Signup: Signup,
    Login: Login
}
/*
d716a4188569b68ab1b6dfac178e570114cdf0ea3a1cc0e31486c3e41241bc6a76424e8c37ab26f096fc85ef9886c8cb634187f4fddff645fb099f1ff54c6b8c
d716a4188569b68ab1b6dfac178e570114cdf0ea3a1cc0e31486c3e41241bc6a76424e8c37ab26f096fc85ef9886c8cb634187f4fddff645fb099f1ff54c6b8c
*/
