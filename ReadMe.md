# Requirement
* Node.js v 4.0 or latest
* Python 2.7 with following packages
  *	PyQuery
  * BeautifulSoup
  * requests
  * lxml
* Database (choice one on following)
  * MariaDB 10.1.8 or latest (Recommend)
  * MySQL 5.5


# Deployment

### Step 1 - Generate key
##### Generate private key & public key for ios(dem form)

    openssl req -x509 -out public_key.der -outform der -new -newkey rsa:4096 -keyout private_key.pem -days 3650 -nodes

##### Use private key to  generate public key for node.js (pem form)

    openssl rsa -in private_key.pem -out public.pub -outform pem -pubout

### Step 2 - Install Python packages

Using pip or easy_install to install following package:
*	PyQuery
* BeautifulSoup
* requests
* lxml

### Step 3 - Install node packages
In the project directory, using command line to install node packages

    npm install


### Step 4 - Modify configuration file
Configure the app by modifying the file `mobileApp/config.json`.
