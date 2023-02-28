# Change Logs

### 2023-01-23 15:38 and prior ###
 **Changed**
 - All responses will include a JSON with **message** field
 - FindAccount has been changed to FindAccountByEmail and FindAccountById
 - File Structure
 - Removed ProfileId from Accounts, Added AccountId to Profiles, Remade BloodTypes


 **Added**
 - Function to ensure JWT token is included in some requests
 - Successful logins will now return a **jwt token** 
 - UpdateAccount
 - RemoveAccountById
 - RemoveAccountByEmail
 - GetEmergencyInfo


 **Removed**

 **Fixed**

<br/>

### 2023-01-23 23:00 ###
 **Changed**


 **Added**
 - EnsureTokenExists to index.js
 - Added JWT tokens to successful logins
 - API document in README.md


 **Removed**
 - Debug print statements


 **Fixed**

 **Planned**
 - Move api handlers to /src/routes
 - Add **Middlewares**

<br/>

### 2023-01-24 22:01 ###

 **Changed**
 - Started using router and routes now
 - When a user signs up for an account, they will be added to a pending list instead of the main accounts db


 **Added**
 - Routes


 **Removed**

 **Fixed**

 **Planned**
 - Add **Middlewares**
 - Finish Email Verification code

<br/>

### 2023-01-25 21:41 (Maxx) ###

 **Changed**
 - Made index page a route

 **Added**
 - new 404 error handler
 - new DB table to store refresh tokens

 **Removed**

 **Fixed**
 - Faulty SignUp function in src/routes/signup.js 
 

 **Planned**
 - Finish verification middleware
 - Add refresh token
 - Finish nodemailer (dunno why it isnt working)

<br/>

### 2023-01-26 14:38 (Maxx) ###

 **Changed**

 **Added**
 - Email verification method 
 - New db queries (VerifyPendingAccount)
 **Removed**

 **Fixed**

 **Planned**
 - Sending emails from nodemailer (gmail disabled Less Secure Apps)

<br/>

### 2023-01-26 21:35 (Maxx) ###

 **Changed**

 **Added**
 - CORS
 
 **Removed**

 **Fixed**

 **Planned**
 - Sending emails from nodemailer (gmail disabled Less Secure Apps)

<br/>

### 2023-01-27 1:42 (Takala) ###

 **Changed**

 **Added**
- login and register API docs
 **Removed**

 **Fixed**

 **Planned**

---

### 2023-01-27 03:14 (JacobLinCool) ###

 **Changed**

- Remove API docs from README.md

 **Added**

- Add setup instructions to README.md
- Default `PORT` is now 8080


### 2023-01-27 03:29 (Maxx) ###

 **Changed**

- Removed conf_password from the signup function


### 2023-01-27 03:29 (Maxx) ###

 **Changed**

**Added**
- Added index.html for testing file uploads
- Multer for file uploads
- /profile/uploads now accepts 1 image file (PNG / JPG / JPEG)

**Removed**
- conf_password from the signup function




### 2023-01-27 03:29 (Maxx) ###

 **Changed**
 - New branch: Maxx

**Added**
 - Profile route
 - File uploads
 
**Removed**


### 2023-02-08 12:40 (Maxx) ###
 
 **Added**
 - "Token.js", a module responsible for handling tokens
 - logout function
 - refresh tokens
 - redis
 - Middlewares for authenticating tokens

 **Changed**
 - Removed jwt token signing from login.js
 
**Removed**


### 2023-02-09 16:02 (Maxx) ###
 
 **Added**
 - Rewrote VeirfyPendingAccount method
 - Made ARC validation distinguish new and old ARC
 - Reset password with link verification (verification part)
 - Email verification (verification part)
 - Added default role to accounts (Forgot the @default() tag) 
 - Getting profile
 - Updating profile (In progress)
 - New DB Queries for FindProfile, UpdateProfile
 - Added IsValidFacebookUrl and IsValidBloodType to Validation
 - Started adding a bunch of type checking to Update profile

 **Changed**
 - Rewrote email verification method
 
**Removed**
- Will to live


### 2023-02-14 17:10 (Maxx) ###
 
 **Added**
 - ESLint

### 2023-02-25 05:51 (Maxx) ###
 **Added**
 - [New Email Service](https://hermes.csie.cool) (Thanks to [@Alphabeee](https://github.com/Alphabeee) and [@JacobLinCool](https://github.com/JacobLinCool))
 - RevokeAllRefreshToken in Tokens.js
 - GetAccountId in Database.js

 **Changed**
 - Rewrote bits of the API Document
 - Signup now splits into /signup/email and /signup/password
 - Database schema

 **Removed**
 - Old deprecated Accounts.js
 - Unused functions in Signup

### 2023-02-27 23:10 (Maxx) ###
 **Added**
 - Added /admin
 - Added a Log() function in Database, some actions will be logged in the database (I'm not sure if this is a good idea ngl)
 - Added Account Roles to the AccessTokens
 - Added DEV_MODE to config.js
 - Added APIs to admin
 - Resturctured DB schema (again)
 
 **Changed**
 - Basically rewrote everything related to refresh tokens (Twice because I'm an idiot + bug fix :3 )


 **Removed**
 

 ### 2023-02-28 09:30 (Maxx) ###
 **Added**
 - /home
 - new API endpoints
 - Most request bodies will now return a new access token IF the user's roles are changed
 
 **Removed**
 - Health
 - Liver
 - Will to live 

  ### 2023-02-28 18:03 (Maxx) ###
 **Changed**
 - Made role validation its own function