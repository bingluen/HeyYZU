# Requirement
* Node.js v5.0 or latest (the environment of development is v6.2.2)
* Python 2.7 with following packages
  * BeautifulSoup
  * requests
  * lxml
  * threadpool
* Database (choice one on following)
  * MariaDB 10.1.8 or latest (Recommend)
  * MongoDB v3.2.7 or latest (for admin webController)
  * redis (for admin webController session)



# Deployment

### Step 1 - Generate key
##### Generate private key & public key for ios(dem form)

    openssl req -x509 -out public_key.der -outform der -new -newkey rsa:4096 -keyout private_key.pem -days 3650 -nodes

##### Use private key to  generate public key for node.js (pem form)

    openssl rsa -in private_key.pem -out public.pub -outform pem -pubout

##### Please place key file on `mobileAPI/key`

### Step 2 - Install Python packages

Using pip or easy_install to install following package:
* BeautifulSoup
* requests
* lxml

### Step 3 - Install node packages
In the project directory, using command line to install node packages

    npm install


### Step 4 - Modify configuration file
Configure the api by modifying the file `mobileAPI/config.json`. Including:
- MariaDB database setting
- key place
Configure the webController by modifying the file `webController/config.json`. Including:
- Allow domain.
