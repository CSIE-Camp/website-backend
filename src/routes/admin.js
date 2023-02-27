const { Log, GetAccountId, FindProfile, AdminViewAllProfile, AdminViewProfile, UpdateAccountStatus, ConfirmPaymentStatus, UpdateAccountRoles, GetLogs, ChangeApplicationStatus} = require("../Modules/Database");
const { ValidateRoles } = require("./../Modules/Validate");
const { AuthenticateAccessToken } = require("../Middleware/AuthenticateToken");

const express = require("express");
const router = express.Router();

router.get("/view-profile/:id", AuthenticateAccessToken, async (req, res) => {
    let ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
    let AccountId = req.userid;
    let AccountRole = req.role;
    let TargetAccount = req.params.id;
    if (!ValidateRoles(AccountRole, 1)){
        await Log(AccountId, AccountRole, `Attempted to access profile ${TargetAccount !== "null" ? TargetAccount : "of all users"} with insufficient privileges from [${ip}]`);
        return res.status(401).json({message: "Insufficient privileges"});
    }
    if (TargetAccount !== "null"){
        return res.status(200).json(await AdminViewProfile(TargetAccount, {AccountId, AccountRole}));
    }
    return res.status(200).json(await AdminViewAllProfile(AccountId, AccountRole));
});

router.post("/confirm-status", AuthenticateAccessToken, async (req, res) => {
    let ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
    let AccountId = req.userid;
    let AccountRole = req.role;
    let TargetAccount = req.body.TargetAccount;
    let NewStatus = req.body.NewStatus || "";
    if (!ValidateRoles(AccountRole, 2)){
        await Log(AccountId, AccountRole, "Attempted to edit application status with insufficient privileges");
        return res.status(401).json({message: "Insufficieitn privileges"});
    }
    let Status = await ChangeApplicationStatus(AccountId, AccountRole, TargetAccount, NewStatus, ip);
    if (!Status[0]){
        return res.status(400).json({message: Status[1]});
    }
    return res.status(200).json({message: Status[1]});
});

router.post("/confirm-payment", AuthenticateAccessToken, async (req, res) => {
    let ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
    let AccountId = req.userid;
    let AccountRole = req.role;
    let TargetAccount = req.body.TargetAccount;
    if (!ValidateRoles(AccountRole, 1)){
        await Log(AccountId, AccountRole, "Attempted to confirm the payment status of accounts with insufficient privileges");
        return res.status(401).json({message: "Insufficient privileges"});
    }
    if (!(TargetAccount)){
        await Log(AccountId, AccountRole, `Attempted to edit payment status without enough arguments from [${ip}}]`); 
        return res.status(401).json("not enough arguments");
    }
    let Status = await ConfirmPaymentStatus(AccountId, AccountRole, TargetAccount, ip);
    if (!Status[0]){
        return res.status(400).json({message: Status[1]});
    }
    return res.status(200).json({message: Status[1]});
});

router.post("/update-roles", AuthenticateAccessToken, async (req, res) => {
    let ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
    let AccountId = req.userid;
    let AccountRole = req.role;
    let TargetAccount = req.body.TargetAccount;
    let NewRole = req.body.NewRole;
    if (!ValidateRoles(AccountRole, 2)){
        await Log(AccountId, AccountRole, `Attempted to edit roles for ${TargetAccount} with insufficient privileges from [${ip}}]`);
        return res.status(403).json({message: "Insufficient privileges"});
    }
    if (!(TargetAccount && NewRole)){
        await Log(AccountId, AccountRole, `Attempted to edit roles without enough arguments from [${ip}}]`); 
        return res.status(400).json({message: "Not enough arguments"});
    }
    if (TargetAccount === AccountId){
        return res.status(403).json({message: "Cannot change self"});
    }
    if (!(NewRole === "STAFF" || NewRole === "ADMIN")){
        return res.status(403).json({message: "Invalid roles"});
    }
    return res.status(200).json(await UpdateAccountRoles(AccountId, AccountRole, TargetAccount, NewRole));
});

router.get("/view-logs/:TargetAccount", AuthenticateAccessToken, async (req, res) => {
    let ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
    let AccountId = req.userid;
    let AccountRole = req.role;
    let TargetAccount = req.params.TargetAccount;
    if (!ValidateRoles(AccountRole, 1)){
        return res.status(403).json({message: "Insufficient privileges"});
    }
    return res.status(200).json(await GetLogs(AccountId, AccountRole, TargetAccount, ip));
});

module.exports = router;
