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

### 2023-01-23 23:00pm ###
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

