var Web3 = require('web3');
var fs = require('fs');

var web3 = new Web3();
web3.setProvider(new web3.providers.HttpProvider('http://localhost:8545'));

var data = fs.readFileSync('contract/EthImage.sol', 'utf-8')
var compiled = web3.eth.compile.solidity(data);
var code = compiled.code;
var abi = compiled.info.abiDefinition;
var myContract;
web3.eth.defaultAccount = web3.eth.coinbase;
console.log(web3.eth.coinbase)
web3.eth.contract(abi).new({
    data: code,
    gas: 500000000000000
}, function(err, contract) {
    if (err) {
        console.error(err);
        return;
    } else if (contract.address) {
        console.log('success');
        myContract = contract;
        fs.writeFileSync('contract/address', myContract.address);
        console.log('address: ' + myContract.address);
    }
});