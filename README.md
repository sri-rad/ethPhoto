## EthPhoto

EthPhoto is an Ethereum based photo sharing *DAPP*!

## Installation

This DAPP will work on any OS that supports **NodeJS**. The installation instructions are written for Debain based systems.  Ensure **git** is installed before proceeding.

* First, copy the folder **photoDapp** to your system and cd into it.

* Install **nvm** and get latest version of **Node** (>=6.9.0) and **npm** (>=4.2.0), using the following script.

```
bash install_nvm.sh
```

* Now install testrpc to simulate an **Ethereum** network (testnet).

```
npm install -g ethereumjs-testrpc
```

* Now install **ipfs** for file-sharing on the Dapp network, using the following script.

```
bash install_ipfs.sh
```

* Install all necessary **node** packages in the folder **photoDapp**.

```
npm install
```

## Running the software

* To simulate the required testnet, start a **testrpc** of 10 clients and a high gas limit on a terminal.

```
testrpc -l 20000000000000000000000000
```

* In another terminal, initialize **IPFS** and start the **IPFS** daemon.

```
ipfs init
ipfs daemon
```

* Now compile and deploy our Solidity contract on Ethereum testnet.

```
node create_contract.js
```

* Now start two nodes that connects to **Ethereum** testnet.

```
node node_one.js
node node_two.js
```

* Access the network at **localhost:3050** and **localhost:3051** as two nodes in your browser.

## Note for users behind a proxy

If you are installing the software behind a proxy network, ensure that you configure **git** and **npm** to work with proxy.

```
git config --global http.proxy http://proxyuser:proxypwd@proxy.server.com:8080
git config --global https.proxy http://proxyuser:proxypwd@proxy.server.com:8080
```

Also, configure **npm** after it's installation, if you are behind a proxy server.

```
npm config set proxy http://proxy.company.com:8080
npm config set https-proxy http://proxy.company.com:8080
```

#### IPFS and Proxy

Due to port filtering, IPFS cannot function behind a proxy server. So, while running IPFS daemon and during further usage of the software, you'll have to use connect to a network that's not behind a proxy.
