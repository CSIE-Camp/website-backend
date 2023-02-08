const { AuthenticateAccessToken } = require("./../Middleware/AuthenticateToken")
const {} = require("./../Modules/Database")
const express = require("express")
const crypto = require("crypto")
const multer = require("multer")
const path = require("path")

const router = express.Router()

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, "..", "uploads", "images"))
    },
    filename: (req, file, cb) => {
        cb (null, crypto.randomBytes(16).toString("hex") + path.extname(file.originalname))
    }
})

const upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        if (file.mimetype !== "image/jpg" && file.mimetype !== "image/jpeg" && file.mimetype != "image/png"){
            cb(null, false)
            return cb(new Error("Only PNG, JPG and JPEG files are accepted!"))
        }
        cb(null, true)
    },
    limits: {
        fileSize: 1024 * 1024 * 2
    }
})

router.post("/update", AuthenticateAccessToken,upload.single("image"), async (req, res) => {
    
    return res.status(200).json({message: "File uploaded!"})
})

module.exports = router