const { AuthenticateAccessToken } = require("../Middleware/AuthenticateToken");
const { GetAccountStatus, UpdatePaymentData, FindAccountById, UploadConsentForm, CompleteTest, ApplyToCamp } = require("../Modules/Database");

const express = require("express");
const crypto = require("crypto");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { CompareRoles } = require("../Modules/Tokens");

const router = express.Router();

const storage = multer.diskStorage({
	destination: (req, file, cb) => {
		cb(null, path.join(__dirname, "..", "Uploads", "ConsentForms"));
	},
	filename: (req, file, cb) => {
		const img = crypto.randomBytes(16).toString("hex") + path.extname(file.originalname);
		req.formpath = `${path.join(__dirname, "..", "Uploads", "ConsentForms")}/${img}`;
		cb(null, img);
	},
});

const upload = multer({
	storage: storage,
	fileFilter: (req, file, cb) => {
		if (file.mimetype !== "application/pdf") {
			cb(null, false);
			return cb(new Error("Only PDF files are accepted!"));
		}
		cb(null, true);
	},
	limits: {
		fileSize: 1024 * 1024 * 2,
	},
});

router.get("/", AuthenticateAccessToken, async (req, res) => {
	const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
	const AccountId = req.userid;
	const AccountRole = req.role;
	const NewToken = await CompareRoles(AccountId, AccountRole, ip);
	const ReturnData = {};
	if (NewToken) {
		ReturnData.tokens.access_token = NewToken;
		ReturnData.tokens.token_type = "Bearer";
	}
	ReturnData.Data = await GetAccountStatus(AccountId);
	return res.status(200).json(ReturnData);
});

router.post("/apply", AuthenticateAccessToken, async (req, res) => {
	const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
	const AccountId = req.userid;
	const AccountRole = req.role;
	const NewToken = await CompareRoles(AccountId, AccountRole, ip);
	const ReturnData = {};
	const Apply = res.body.apply;
	if (NewToken) {
		ReturnData.tokens.access_token = NewToken;
		ReturnData.tokens.token_type = "Bearer";
	}
	if (!Apply || typeof Apply !== "boolean") {
		ReturnData.message = "Not enough argument";
		return res.status(400).json(ReturnData);
	}
	await ApplyToCamp(AccountId, Apply);
	ReturnData.message = "success";
	return res.status(200).json(ReturnData);
});

function RemoveFile(PathName) {
	fs.unlink(PathName, (err) => {
		if (err) {
			console.error(err);
		}
	});
}

router.post("/complete-test", AuthenticateAccessToken, async (req, res) => {
	const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
	const AccountId = req.userid;
	const AccountRole = req.role;
	const CompletedTest = req.body.CompletedTest || false;

	const NewToken = await CompareRoles(AccountId, AccountRole, ip);
	const ReturnData = {};
	if (NewToken) {
		ReturnData.tokens.access_token = NewToken;
		ReturnData.tokens.token_type = "Bearer";
	}
	if (!CompletedTest) {
		ReturnData.message = "Test not completed!";
		return res.status(400).json(ReturnData);
	}
	await CompleteTest(AccountId);
	ReturnData.message = "success!";
	return res.status(200).json(ReturnData);
});

router.post("/upload", AuthenticateAccessToken, upload.single("ConsentForm"), async (req, res) => {
	const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
	const AccountId = req.userid;
	const AccountRole = req.role;
	const FilePath = req.formpath;
	const NewToken = await CompareRoles(AccountId, AccountRole, ip);
	const ReturnData = {};
	if (NewToken) {
		ReturnData.tokens.access_token = NewToken;
		ReturnData.tokens.token_type = "Bearer";
	}
	const Account = await FindAccountById(AccountId);
	if (Account.Status !== "ACCEPTED" || Account.Status !== "WAITLIST_ACCEPTED") {
		RemoveFile(FilePath);
		ReturnData.message = "Not accepted";
		return res.status(400).json(ReturnData);
	}
	await UploadConsentForm(AccountId, FilePath);
	ReturnData.message = "Uploaded!";
	return res.status(200).json(ReturnData);
});

router.post("/update-payment", AuthenticateAccessToken, async (req, res) => {
	const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
	const AccountId = req.userid;
	const AccountRole = req.role;
	const PaymentData = req.body.PaymentData || null;
	const NewToken = await CompareRoles(AccountId, AccountRole, ip);
	const ReturnData = {};
	if (NewToken) {
		ReturnData.tokens.access_token = NewToken;
		ReturnData.tokens.token_type = "Bearer";
	}
	if (!PaymentData) {
		ReturnData.message = "Missing PaymentData";
		return res.status(400).json(ReturnData);
	}
	const Required = ["TransferDate", "AccountName", "Account_Last5Digits"];
	const Keys = Object.keys(PaymentData);
	if (Keys.length < Required.length) {
		ReturnData.message = "Not enough data";
		return res.status(400).json(ReturnData);
	}
	let HasAll = true;
	for (let i = 0; i < Keys.length; i++) {
		if (Required.indexOf(Keys[i]) === -1) {
			HasAll = false;
			return;
		}
	}
	if (!HasAll) {
		ReturnData.message = "Missing PaymentData";
		return res.status(400).json(ReturnData);
	}
	const Status = await UpdatePaymentData(AccountId, PaymentData);
	ReturnData.message = Status ? "success" : "Not accepted!";
	return res.status(Status ? 200 : 400).json(ReturnData);
});

module.exports = router;