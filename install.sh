#!/bin/bash

# This will install ZeroKit authentication module for Realm Object Server
# 
# Prerequisites:
# Installed and working git and npm.
#
# Target folder:
# /usr/local/zerokit/zerokit-realm-auth-provider
#
# Project page:
# https://github.com/tresorit/ZeroKit-Realm-auth-provider
#
# Licence: BSD 3-Clause License
#
# (C) Copyright 2017 by Tresorit AG.

# Defining colors
RED='\033[0;31m'
NC='\033[0m'
GREEN='\033[0;32m'

echo -n "Checking environment"

# Make sure only root can run our script
if [ "$(id -u)" != "0" ]; then
   printf "[${RED}FAIL${NC}]\n"
   echo "This script must be run as root. Aborting." 1>&2
   exit 1
fi

# Check program requirments
command -v git >/dev/null 2>&1 || {  printf "[${RED}FAIL${NC}]\n"; echo >&2 "The command 'git' is required but it's not installed.  Aborting."; exit 1; }
command -v npm >/dev/null 2>&1 || {  printf "[${RED}FAIL${NC}]\n"; echo >&2 "The command 'npm' is required but it's not installed.  Aborting."; exit 1; }

printf "[${GREEN}OK${NC}]\n"

echo -n "Creating target folder /usr/local/zerokit/zerokit-realm-auth-provider"

# Check if a module is already installed
if [ -n "$(ls -A /usr/local/zerokit/zerokit-realm-auth-provider >/dev/null 2>&1)" ]; then
   printf "[${RED}FAIL${NC}]\n";
   echo "Directory already exists and not empty. Aborting."
   exit 1
fi

# Check if directory exists
if [ ! -d "/usr/local/zerokit" ]; then
   mkdir /usr/local/zerokit
   if [ $? -ne 0 ]; then
      printf "[${RED}FAIL${NC}]\n";
      echo "Failed to create directory /usr/local/zerokit. Aborting."
      exit 1
   fi
fi

if [ ! -d "/usr/local/zerokit/zerokit-realm-auth-provider" ]; then
   mkdir /usr/local/zerokit/zerokit-realm-auth-provider
   if [ $? -ne 0 ]; then
      printf "[${RED}FAIL${NC}]\n";
      echo "Failed to create directory /usr/local/zerokit/zerokit-realm-auth-provider. Aborting."
      exit 1
   fi
fi

printf "[${GREEN}OK${NC}]\n"

# Check out repository
echo -n "Cloning repository https://github.com/tresorit/ZeroKit-Realm-auth-provider.git into /usr/local/zerokit/zerokit-realm-auth-provider"
git clone https://github.com/tresorit/ZeroKit-Realm-auth-provider.git /usr/local/zerokit/zerokit-realm-auth-provider --quiet

if [ $? -ne 0 ]; then
   printf "[${RED}FAIL${NC}]\n"
   echo "Failed to clone repository https://github.com/tresorit/ZeroKit-Realm-auth-provider.git. Aborting."
   exit 1
fi

printf "[${GREEN}OK${NC}]\n"

# Init NPM
echo -n "Initializing NPM packages for authentication provider"
npm install --silent --prefix /usr/local/zerokit/zerokit-realm-auth-provider >/dev/null 2>&1

if [ $? -ne 0 ]; then
   printf "[${RED}FAIL${NC}]\n";
   echo "Failed to install required npm packages. Aborting."
   exit 1
fi


printf "[${GREEN}OK${NC}]\n"
# Print success
echo ""
echo "Installation was completed successfully."
echo ""

# Print config file snippet
(cat <<EOF
Please insert this snippet into the config file (configuration.yml) of your Realm Object Server installation and then configure your tenant and the Realm server.

Realm Object Server's config file is can be found:
 - On linux: /etc/realm/configuration.yml
 - On OsX:   {realm-mobile-platform-directory}/realm-object-server/object-server/configuration.yml

- - - - - - - - - - - - - - Copy after this line - - - - - - - - - - - - - - - -
  providers:
    # This enables login via ZeroKit's secure identity provider
    custom/zerokit:
      # The client ID of the IDP client created for the Realm object server
      # on ZeroKit management portal (https://manage.tresori.io)
      client_id: 'your_idp_client_id'

      # The client secret of the IDP client created for the Realm object server
      # on ZeroKit management portal (https://manage.tresori.io)
      client_secret: 'your_idp_client_secret'

      # The service URL of your ZeroKit tenant. It can be found on the main
      # configuration page of your tenant on ZeroKit management portal
      # (https://manage.tresori.io)
      service_url: 'https://your_tenant_id.api.tresorit.io'

      # The include path to use for including ZeroKit auth implementation.
      # Usually it's /usr/local/zerokit/zerokit-realm-auth-provider
      include_path: '/usr/local/zerokit/zerokit-realm-auth-provider'

      # This refers to the actual implementation (should be zerokitauth)
      implementation: 'zerokitauth'
- - - - - - - - - - - - - - Copy before this line - - - - - - - - - - - - - - -

EOF
)
