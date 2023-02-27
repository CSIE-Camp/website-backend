const { AuthenticateAccessToken } = require("./../Middleware/AuthenticateToken");
const { FindProfile, UpdateProfile } = require("./../Modules/Database");
const { ValidateDocuments, IsValidNumber, IsValidFacebookUrl, IsValidBloodType } = require("./../Modules/Validate");

const express = require("express");
const crypto = require("crypto");
const multer = require("multer");
const path = require("path");

const router = express.Router();

const storage = multer.diskStorage({
	destination: (req, file, cb) => {
		cb(null, path.join(__dirname, "..", "uploads", "images"));
	},
	filename: (req, file, cb) => {
		let img = crypto.randomBytes(16).toString("hex") + path.extname(file.originalname);
		req.path = `${path.join(__dirname, "..", "uploads", "images")}/${img}`;
		cb(null, img);
	},
});

const upload = multer({
	storage: storage,
	fileFilter: (req, file, cb) => {
		if (file.mimetype !== "image/jpg" && file.mimetype !== "image/jpeg" && file.mimetype != "image/png") {
			cb(null, false);
			return cb(new Error("Only PNG, JPG and JPEG files are accepted!"));
		}
		cb(null, true);
	},
	limits: {
		fileSize: 1024 * 1024 * 2,
	},
});

router.get("/", AuthenticateAccessToken, async (req, res) => {
	let ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
	let UserId = req.userid;
	let profile = await FindProfile(UserId);
	return res.status(200).json({ success: true, profile });
});

router.post("/update", AuthenticateAccessToken, upload.single("image"), async (req, res) => {
	let ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
	let profile = JSON.parse(req.body.profile);
	profile.SelfPortrait = req.path || "";
	let UserId = req.userid;
	let doc_flag = false;
	if (profile.id || profile.AccountId) {
		return res.status(403).json({ message: "Well...at least you tried" });
	}
	if (profile.ID_Documents){
		let {success, doc} = ValidateDocuments(profile.ID_Documents);
		doc_flag = success;
		profile.ID_Documents = doc;
	}
	if (profile.Number){
		if (!IsValidNumber(profile.Number)){
			profile.Number = null;
		}
	}
	if (profile.Emergency_ContactNumber){
		if (!IsValidNumber(profile.Emergency_ContactNumber)){
			profile.Emergency_ContactNumber = null;
		}
	}
	if (profile.Emergency_BloodType){
		if (!IsValidBloodType(profile.Emergency_BloodType)){
			profile.Emergency_BloodType = null;
		}
	}
	if (profile.Facebook){
		if (!IsValidFacebookUrl(profile.Facebook)){
			profile.Facebook = null;
		}
	}
	await UpdateProfile(UserId, profile);

	return res.status(200).json({ message: "Profile updated" });
});

module.exports = router;