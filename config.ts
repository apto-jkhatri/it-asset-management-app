// Azure AD / Microsoft Entra ID Configuration
export const AZURE_CONFIG = {
  clientId: "YOUR_AZURE_CLIENT_ID", // Replace with your Application (client) ID
  authority: "https://login.microsoftonline.com/YOUR_TENANT_ID", // Replace with your Tenant ID
  redirectUri: "http://localhost", // Standard for Electron dev; production might use a custom protocol
  scopes: ["User.Read", "profile", "openid"]
};
