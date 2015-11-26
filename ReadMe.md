# 產生key
### 產生private key & public key for ios(dem form)

    openssl req -x509 -out public_key.der -outform der -new -newkey rsa:4096 -keyout private_key.pem -days 3650 -nodes

###利用private key 產生 public key for node.js (pem form)

    openssl rsa -in private_key.pem -out public.pub -outform pem -pubout
