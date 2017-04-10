pragma solidity ^0.4.4;

contract EthPhoto {
    struct Image { 
        address user;
        string small_hash;
        string large_hash;
        string topics;
        string lat;
        string lon;
    }

    event Addition(string image_hash);
    mapping (address => string) username;
	mapping (string => Image) imgs;

    function EthPhoto() {
        username[tx.origin] = 'anon';
    }

    function getImageOwner(string image_hash) returns(address) {
		return imgs[image_hash].user;
	}

    function uploadImage(string small_hash, string large_hash, string topics, string lat, string lon) {
        Addition(large_hash);
        imgs[large_hash] = Image(msg.sender, small_hash, large_hash, topics, lat, lon);
    }

    function imagePresent(string hash) returns(bool) {
        if (imgs[hash].user == address(0)) {
            return false;
        }
        else {
            return true;
        }
    }

    function deleteImage(string hash) {
        if (imgs[hash].user == msg.sender)
            {
                imgs[hash].user = address(0);
            }
    }
    
    function setUsername(string _username) {
        username[msg.sender] = _username;
    }

    function getUsername(string hash) returns(string) {
            return (username[imgs[hash].user]);
    }

    function getLat(string hash) returns(string){
        return imgs[hash].lat;
    }
    
    function getLon(string hash) returns(string){
        return imgs[hash].lon;
    }

    function getTopics(string hash) returns(string) {
        return imgs[hash].topics;
    }

    function getThumb(string hash) returns(string) {
        return imgs[hash].small_hash;
    }

    function canDelete(string hash) returns(bool) {
        if(msg.sender == imgs[hash].user) {
            return true;
        }
        else {
            return false;
        }
    }

    function getUsernameByAdd() returns(string) {
        return (username[msg.sender]);
    }

    function getSender() returns(address) {
        return(msg.sender);
    }
}
