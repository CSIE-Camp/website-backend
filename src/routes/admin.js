const { Log, GetAccountId, FindProfile, AdminViewAllProfile, AdminViewProfile, FindAccountById, ConfirmPaymentStatus, UpdateAccountRoles, GetLogs, ChangeApplicationStatus, GetCampStatus, UpdateCampStatus, FindDataByName} = require("../Modules/Database");
const { ValidateRoles } = require("./../Modules/Validate");
const { AuthenticateAccessToken } = require("../Middleware/AuthenticateToken");

const express = require("express");
const { GenerateAccessToken, CompareRoles} = require("../Modules/Tokens");
const router = express.Router();

router.get("/view-profile/:id", AuthenticateAccessToken, async (req, res) => {
    let ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
    let AccountId = req.userid;
    let AccountRole = req.role;
    let TargetAccount = req.params.id;
    let NeedNewToken = false;
    let NewToken = null;
    let NewRole = null;
    if (!ValidateRoles(AccountRole, 1)){
        let Account = await FindAccountById(AccountId);
        if (!ValidateRoles(Account.Role, 1)){
            await Log(AccountId, AccountRole, `Attempted to access profile ${TargetAccount !== "null" ? TargetAccount : "of all users"} with insufficient privileges from [${ip}]`);
            return res.status(401).json({message: "Insufficient privileges"});
        }
        NewRole = Account.Role;
        NeedNewToken = true;
    }
    if (NeedNewToken){
        NewToken = await GenerateAccessToken(AccountId, NewRole, ip);
    }
    let ReturnData = {};
    if (NewToken){
        ReturnData.tokens.access_token = NewToken;
        ReturnData.tokens.token_type = "Bearer";
    }
    if (TargetAccount !== "null"){
        ReturnData.ProfileData = await AdminViewProfile(TargetAccount, AccountId, AccountRole);
        return res.status(200).json(ReturnData);
    }
    ReturnData.ProfileData = await AdminViewAllProfile(AccountId, AccountRole);
    return res.status(200).json(ReturnData);
});

router.post("/confirm-status", AuthenticateAccessToken, async (req, res) => {
    let ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
    let AccountId = req.userid;
    let AccountRole = req.role;
    let TargetAccount = req.body.TargetAccount;
    let NewStatus = req.body.NewStatus || "";
    let NeedNewToken = false;
    let NewToken = null;
    let NewRole = null;
    if (!ValidateRoles(AccountRole, 2)){
        let Account = await FindAccountById(AccountId);
        if (!ValidateRoles(Account.Role, 1)){
            await Log(AccountId, AccountRole, "Attempted to edit application status with insufficient privileges");
            return res.status(401).json({message: "Insufficieitn privileges"});
        }
        NewRole = Account.Role;
        NeedNewToken = true;
    }
    let Status = await ChangeApplicationStatus(AccountId, AccountRole, TargetAccount, NewStatus, ip);
    if (NeedNewToken){
        NewToken = await GenerateAccessToken(AccountId, NewRole, ip);
    }
    let ReturnData = {};
    if (NewToken){
        ReturnData.tokens.access_token = NewToken;
        ReturnData.tokens.token_type = "Bearer";
    }
    if (!Status[0]){
        ReturnData.message = Status[1];
        return res.status(400).json(ReturnData);
    }
    ReturnData.message = Status[1];
    return res.status(200).json(ReturnData);
});

router.post("/confirm-payment", AuthenticateAccessToken, async (req, res) => {
    let ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
    let AccountId = req.userid;
    let AccountRole = req.role;
    let TargetAccount = req.body.TargetAccount || "";
    let NeedNewToken = false;
    let NewToken = null;
    let NewRole = null;
    if (!ValidateRoles(AccountRole, 1)){
        let Account = await FindAccountById(AccountId);
        if (!ValidateRoles(Account.Role, 1)){
            await Log(AccountId, AccountRole, "Attempted to confirm the payment status of accounts with insufficient privileges");
            return res.status(401).json({message: "Insufficient privileges"});
        }
        NewRole = Account.Role;
        NeedNewToken = true;
    }
    if (NeedNewToken){
        NewToken = await GenerateAccessToken(AccountId, NewRole, ip);
    }
    let ReturnData = {};
    if (NewToken){
        ReturnData.tokens.access_token = NewToken;
        ReturnData.tokens.token_type = "Bearer";
    }
    if (!(TargetAccount)){
        await Log(AccountId, AccountRole, `Attempted to edit payment status without enough arguments from [${ip}}]`);
        ReturnData.message = "Not enough arguments";
        return res.status(401).json(ReturnData);
    }
    let Status = await ConfirmPaymentStatus(AccountId, AccountRole, TargetAccount, ip);
    ReturnData.message = Status[1];
    if (!Status[0]){
        return res.status(400).json(ReturnData);
    }
    return res.status(200).json(ReturnData);
});

router.post("/update-roles", AuthenticateAccessToken, async (req, res) => {
    let ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
    let AccountId = req.userid;
    let AccountRole = req.role;
    let TargetAccount = req.body.TargetAccount;
    let PendingRole = req.body.NewRole;
    let NeedNewToken = false;
    let NewToken = null;
    let NewRole = null;
    if (!ValidateRoles(AccountRole, 2)){
        let Account = await FindAccountById(AccountId);
        if (!ValidateRoles(Account.Role, 2)){
            await Log(AccountId, AccountRole, `Attempted to edit roles for ${TargetAccount} with insufficient privileges from [${ip}}]`);
            return res.status(403).json({message: "Insufficient privileges"});
        }
        NewRole = Account.Role;
        NeedNewToken = true;
    }
    let ReturnData = {};
    if (NewToken){
        ReturnData.tokens.access_token = NewToken;
        ReturnData.tokens.token_type = "Bearer";
    }
    if (!(TargetAccount && PendingRole)){
        await Log(AccountId, AccountRole, `Attempted to edit roles without enough arguments from [${ip}}]`);
        ReturnData.message = "Not enough arguments";
        return res.status(400).json(ReturnData);
    }
    if (TargetAccount === AccountId){
        ReturnData.message = "Cannot change roles for self";
        return res.status(403).json(ReturnData);
    }
    if (!(PendingRole === "STAFF" || PendingRole === "ADMIN")){
        ReturnData.message = "Invalid Roles";
        return res.status(403).json(ReturnData);
    }
    let RoleData = await UpdateAccountRoles(AccountId, AccountRole, TargetAccount, PendingRole);
    ReturnData.RoleData = RoleData;
    return res.status(200).json(ReturnData);
});

router.get("/view-logs/:TargetAccount", AuthenticateAccessToken, async (req, res) => {
    let ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
    let AccountId = req.userid;
    let AccountRole = req.role;
    let TargetAccount = req.params.TargetAccount;
    let NeedNewToken = false;
    let NewToken = null;
    let NewRole = null;
    if (!ValidateRoles(AccountRole, 1)){
        let Account = await FindAccountById(AccountId);
        if (!ValidateRoles(Account.Role, 2)){
            return res.status(403).json({message: "Insufficient privileges"});
        }
        NewRole = Account.Role;
        NeedNewToken = true;
    }
    let ReturnData = {};
    if (NewToken){
        ReturnData.tokens.access_token = NewToken;
        ReturnData.tokens.token_type = "Bearer";
    }
    ReturnData.Logs = await GetLogs(AccountId, AccountRole, TargetAccount, ip);
    return res.status(200).json(ReturnData);
});

router.get("/get-camp-status", AuthenticateAccessToken, async (req, res) => {
    let ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
    let AccountId = req.userid;
    let CurrentRole = req.role;
    let NewToken = await CompareRoles(AccountId, CurrentRole, ip);
    let ReturnData = {};
    if (NewToken){
        ReturnData.tokens.access_token = NewToken;
        ReturnData.tokens.token_type = "Bearer";
    }
    ReturnData.CampStatus = await GetCampStatus();
    return res.status(200).json(ReturnData);
});

router.post("/search", AuthenticateAccessToken, async (req, res) => {
    let ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
    let AccountId = req.userid;
    let AccountRole = req.role;
    let Name = req.body.Name || "";
    let NeedNewToken = false;
    let NewToken = null;
    let NewRole = null;
    if (!ValidateRoles(AccountRole, 1)){
        let Account = await FindAccountById(AccountId);
        if (!ValidateRoles(Account.Role, 1)){
            return res.status(403).json({message: "Insufficient privileges"});
        }
        NewRole = Account.Role;
        NeedNewToken = true;
    }
    let ReturnData = {};
    if (NewToken){
        ReturnData.tokens.access_token = NewToken;
        ReturnData.tokens.token_type = "Bearer";
    }
    ReturnData.TargetAccounts = await FindDataByName(Name);
    return res.status(200).json(ReturnData);
});

router.post("/edit-camp-status", AuthenticateAccessToken, async (req, res) => {
    let ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
    let AccountId = req.userid;
    let AccountRole = req.role;
    let NewStatus = req.body;
    let NeedNewToken = false;
    let NewToken = null;
    let NewRole = null;
    if (!ValidateRoles(AccountRole, 2)){
        let Account = await FindAccountById(AccountId);
        if (!ValidateRoles(Account.Role, 2)){
            return res.status(403).json({message: "Insufficient privileges"});
        }
        NewRole = Account.Role;
        NeedNewToken = true;
    }
    let ReturnData = {};
    if (NewToken){
        ReturnData.tokens.access_token = NewToken;
        ReturnData.tokens.token_type = "Bearer";
    }
    let Keys = Object.keys(NewStatus);
    const Allowed = ["Apply_Deadline_TimeStamp", "Allow_Registration", "Allow_Status_Lookup"];
    for (let i = 0; i < Keys.length; i++){
        let Index = Allowed.indexOf(Keys[i]); 
        if (Index === -1){
            delete(NewStatus[Keys[i]]);
            continue;
        }
        if (Index === 0){
            if (typeof NewStatus[Keys[i]] !== "string" || !Number(NewStatus[Keys[i]])){
                console.log("Not string");
                delete(NewStatus[Keys[i]]);
                continue;
            }
        }
        if (Index === 1 || Index == 2){
            if (typeof NewStatus[Keys[i]] !== "boolean"){
                delete(NewStatus[Keys[i]]);
                continue;
            }
        }
    }
    NewStatus.LastEditedBy = AccountId;
    let CampStatus = await UpdateCampStatus(AccountId, AccountRole, NewStatus, ip);
    ReturnData.CampStatus = CampStatus;
    return res.status(200).json(ReturnData);
});

module.exports = router;
