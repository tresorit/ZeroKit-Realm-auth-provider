# ZeroKit-Realm-auth-provider
ZeroKit-Realm-auth-provider is an authentication module for Realm Object Server (ROS) to enable ZeroKit-based authentication.

# Additional information about ZeroKit and Realm Object Server
* More information about ZeroKit: https://tresorit.com/zerokit
* ZeroKit admin portal: https://manage.tresorit.io
* More information about Realm Object server external authentication: https://realm.io/docs/realm-object-server/#custom-authentication

# Prerequisites
1. To use this module you will first need to register a ZeroKit tenant. (You can get a free sandbox tenant at: https://manage.tresorit.io)

2. You also need a deployed Realm Object Server (it can be any edition, including a free Developer edition installed on your local machine or on a VM)
**The installation process has to be done on the machine which hosts the ROS server.**

3. You should have a working git and npm (nodejs) installed on the machine.

4. If your ROS is up and running, then you have to install the auth module at first, follow the directions of the next section.

# Installation:

## Automatic (recommended)
This will automatically proceed the installation. Please type the following command into a shell:

```bash
curl -sL https://github.com/tresorit/ZeroKit-Realm-auth-provider/raw/master/install.sh | sudo -E bash -
```

After the script completes, you can continue with Configuration steps.
  
## Manual way
To install the module manually:

1. At first, please navigate to the folder /usr/local and create the following directory structure: /usr/local/zerokit/zerokit-realm-auth-provider

  ```bash
   sudo mkdir -p /usr/local/zerokit/zerokit-realm-auth-provider
   ```

2. Please check out this repository there with the following command:

  ```bash
  sudo git clone https://github.com/tresorit/ZeroKit-Realm-auth-provider.git /usr/local/zerokit/zerokit-realm-auth-provider
  ```
  
3. Now the NPM packages used by the login module have to be initialized
  ```bash
 sudo npm install --prefix /usr/local/zerokit/zerokit-realm-auth-provider
  ```

# Configuration
The installation is complete, but to automatically load the module the server has to be configured.

1.  Open the config file of ROS (configuration.yml) and paste the following yml snippet into the auth/providers section.

  > Realm Object Server's config file is can be found:
  >   - On linux: /etc/realm/configuration.yml
  >   - On OsX:   {realm-mobile-platform-directory}/realm-object-server/object-server/configuration.yml

  **Configuration block of ZeroKit auth module for ROS:**
  ```yml
  auth:
    providers:
	  # This enables login via ZeroKit's secure identity provider
      custom/zerokit:
       # The client ID of the IDP client created for the Realm object server
       # on ZeroKit management portal (https://manage.tresori.io)
       client_id: 'example_client'
  
       # The client secret of the IDP client created for the Realm object server
       # on ZeroKit management portal (https://manage.tresori.io)
       client_secret: 'example_secret'
  
       # The service URL of your ZeroKit tenant. It can be found on the main
       # configuration page of your tenant on ZeroKit management portal
       # (https://manage.tresori.io)
       service_url: 'https://example.api.tresorit.io'

      # The include path to use for including ZeroKit auth implementation.
      # Usually it's /usr/local/zerokit/zerokit-realm-auth-provider
      include_path: '/usr/local/zerokit/zerokit-realm-auth-provider'

      # This refers to the actual implementation (should be zerokitauth)
      implementation: 'zerokitauth'
  ```

2. Navigate to the configuration page of you tenant at https://manage.tresorit.io, find the "IDP" section and add a sdk client by clicking on the "Add SDK client button".

  ![alt text](https://github.com/tresorit/ZeroKit-Realm-auth-provider/raw/master/images/zerokit_realm_idp_section.png "Add SDK client")

  * The name can be your choice, its only used by the portal to identify your client.
  * Click apply. (It can take 2-5 minutes for the changes to be effective).
  
  ***Note:*** You will need the data displayed here later. Remember: you can come back here anytime and click on the name of the client to see or edit details of it.

  ![alt text](https://github.com/tresorit/ZeroKit-Realm-auth-provider/raw/master/images/zerokit_realm_idp_client.png "Example IDP config")

3. Edit /etc/realm/configuration.yml, and copy the newly created IDP client's information from the management portal to the previously created config section. 

  ```yml
  auth:
    providers:
	  # This enables login via ZeroKit's secure identity provider
      custom/zerokit:
       # The client ID of the IDP client created for the Realm object server
       # on ZeroKit management portal (https://manage.tresori.io)
       client_id: 'huexq#####_yS5yfJaHIB_sdk'
  
       # The client secret of the IDP client created for the Realm object server
       # on ZeroKit management portal (https://manage.tresori.io)
       client_secret: 'bJDJJDolRJLnXdF8'
  
       # The service URL of your ZeroKit tenant. It can be found on the main
       # configuration page of your tenant on ZeroKit management portal
       # (https://manage.tresori.io)
       service_url: 'https://huexq#####.api.tresorit.io'

      # The include path to use for including ZeroKit auth implementation.
      # Usually it's /usr/local/zerokit/zerokit-realm-auth-provider
      include_path: '/usr/local/zerokit/zerokit-realm-auth-provider'

      # This refers to the actual implementation (should be zerokitauth)
      implementation: 'zerokitauth'
  ```

  ***Note:*** The service URL of your tenant can also be found on the same config page:
  
  ![alt text](https://github.com/tresorit/ZeroKit-Realm-auth-provider/raw/master/images/zerokit_realm_service_url.png "Example auth config")

4. Now you can restart ROS to pick up new config. If you are using **linux**, please type the following line in a terminal:

  ```bash
  sudo systemctl restart realm-object-server
  ```

  If you are using **OsX**, you have to stop and start again ROS with the script provided in the bundle (*"start-object-server.command"*).

# Usage from clients:
To use the authentication from clients, first you have to include both ZeroKit client SDK and Realm client SDK into your app.

1. First, log in into ZeroKit SDK, and after the successful login call the "GetIdentityTokes()" function of the ZeroKit client with the id of your newly configured IDP client id. The call will result in an object containing an authorization code, an identity token (can be used at client side) and optionally a code verifier. (Only if your IDP client configured to use verifier.)

2. Take the authorization code from the result and call the custom authentication function of the Realm SDK with the following parameters:
  * token: authorization code
  * auth type: "custom/zerokit"

  **Note:** only if the ZeroKit api returned a verifier, concatenate the verifier to the authorization code separated by a colon (':').

3. The ROS server will redeem your auth code for an identity token directly at ZeroKit tenant's IDP endpoints, and then automatically completes the login. Your Realm user id will became the ZeroKit user ID.


## Documentation links for external auth in Realm SDKs
* Java: https://realm.io/docs/java/latest/#custom-auth
* Objective-C: https://realm.io/docs/objc/latest/#custom-authentication
* Xamarin: https://realm.io/docs/xamarin/latest/#custom-auth
* Swift: https://realm.io/docs/swift/latest/#custom-authentication
* Javascript: https://realm.io/docs/javascript/latest/#custom-auth