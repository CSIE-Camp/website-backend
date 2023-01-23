# Change Logs

###2023-01-23 15:38 and before###
 **Changed**
 - All responses will include a JSON array with **message** field
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
