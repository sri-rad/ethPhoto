var fs = require('fs');
var Web3 = require('web3');
var Mustache = require('mustache');

var express = require('express');
var app = express();

var gm = require('gm').subClass({imageMagick: true});
var smartcrop = require('smartcrop-gm');


var qs = require('querystring');
var bodyParser = require('body-parser');
const fileUpload = require('express-fileupload'); 

var global_images = [];

const file_folder = __dirname+'/files/'

app.use(fileUpload());
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

var GoogleMapsAPI = require('googlemaps');

var publicConfig = {
  key: ' AIzaSyB9vsjYH5PeNWEUOo_NGLqRLSn7zmPqKQA ',
  stagger_time:       1000, // for elevationPath
  encode_polylines:   false,
  secure:             true, // use https
};

var gmAPI = new GoogleMapsAPI(publicConfig);

if (typeof window !== 'undefined' && typeof window.Web3 === 'undefined') {
    window.Web3 = Web3;
}

/*
* This function creates a thumbnail out of a given image
* and uploads both original image and the thumbnail to 
* IPFS. Also, updates the ethereum blockchain with changes
*/
function applySmartCrop(body, dest, width, height, req, res) {
  smartcrop.crop(body, {width: width, height: height}).then(function(result) {
      var crop = result.topCrop;
      gm(body)
        .crop(crop.width, crop.height, crop.x, crop.y)
        .resize(width, height)
        .write(dest, function(error){
            if (error) return console.error(error);
             large_hash = saveToIPFS(body);
             small_hash = saveToIPFS(dest);
             myContract.uploadImage.sendTransaction(small_hash, large_hash, req.body.topics, req.body.lat, req.body.lon, {gas:2000000});
             res.redirect('/');
        });
    });
}

/*
* Saves file to IPFS
*/
function saveToIPFS(path_to_file) {
  var exec = require('child_process').execSync;
  var cmd = 'ipfs add "' + path_to_file + '"';
  console.log(cmd);
  stdout = exec(cmd).toString();
  hash = stdout.split(" ")[1];
  console.log('Hash', hash)
  return hash;
}

var web3 = new Web3();
web3.setProvider(new web3.providers.HttpProvider('http://localhost:8545'));

var data = fs.readFileSync('contract/EthImage.sol', 'utf-8')
var compiled = web3.eth.compile.solidity(data);
var code = compiled.code;
var abi = compiled.info.abiDefinition;
var contractAbi = web3.eth.contract(abi);
address = fs.readFileSync('contract/address', 'utf-8');
var myContract = contractAbi.at(address);
web3.eth.defaultAccount = web3.eth.accounts[2];
console.log(web3.eth.coinbase)

/*
* This endpoint serves the data.js file.
*/
app.get('/data', function(req, res) {
    res.sendFile(__dirname + '/files/data.js')
})

/*
* Serves homepage of the webUI
*/
app.get('/', function(req, res) {
    var username = myContract.getUsernameByAdd.call();
    var imgs = [];
    /*
    * This event is used to get logs of all
    * image uploads to the blockchain. This is
    * useful to create a list of all uploaded
    * images in the blockchain.
    */
    var event = myContract.Addition({}, {
        fromBlock: 0,
        toBlock: 'latest'
    });
    event.get(function(error, result) {
        for (var j = 0; j < result.length; j++) {
            hash = result[j]['args']['image_hash'];
            if (!myContract.imagePresent.call(hash)) {
                continue;
            }
            var temp = {};
            var lat = myContract.getLat.call(hash);
            var lon = myContract.getLon.call(hash);
            temp["hash"] = hash;
            temp["location"] = [lat, lon];
            temp["thumbnail"] = myContract.getThumb.call(hash);
            imgs.push(temp);
        }
        global_images = imgs;
        datajs = JSON.stringify(imgs);
        fs.writeFileSync(__dirname + '/files/data.js', 'var content =' + datajs);
        ins = {
          username: username
        };
        var view = Mustache.render(fs.readFileSync(__dirname + '/templates/home.html', 'utf-8'), ins);
        res.send(view);
    });
});

/*
* This endpoint serves the map with images of search topic.
* Gets data from the blockchain using web3 api.
* Takes topic as parameter.
*/
app.get('/topic_search', function(req, res) {
    new_list = []
    search = req.query.topic;
    search_terms = search.replace(',', ' ').split(' ');
    console.log(search_terms);
    for (var k = 0; k < search_terms.length; k++) {
        for (var i = 0; i < global_images.length; i++) {
            topics = myContract.getTopics.call(global_images[i]["hash"]);
            topics = topics.replace(',', ' ').split(' ');
            console.log(topics)
            for (var j = 0; j < topics.length; j++) {
                if (topics[j].trim() == search_terms[k].trim()) {
                    new_list.push(global_images[i]);
                }
            }
        }
    }
    datajs = JSON.stringify(new_list);
    fs.writeFileSync(__dirname + '/files/data.js', 'var content =' + datajs);
    ins = {
      username: myContract.getUsernameByAdd.call()
    };
    var view = Mustache.render(fs.readFileSync(__dirname + '/templates/home.html', 'utf-8'), ins);
    res.send(view);
})

/*
* Endpoint returns page for viewing images 
* including user who uploaded the image and
* topics associated with it.
* Takes image hash as parameter.
*/
app.get('/view_image', function(req, res) {
    var ins = {
        hash: req.query.hash,
        topics: myContract.getTopics.call(req.query.hash),
        username: myContract.getUsername.call(req.query.hash),
        location: myContract.getLat.call(req.query.hash)+', '+myContract.getLon.call(req.query.hash),
        username_add: myContract.getUsernameByAdd.call()
    };
    var view = Mustache.render(fs.readFileSync(__dirname+'/templates/view_image.html', 'utf-8'), ins);
    res.send(view);
})

/*
* Allows user to change his username (UI)
*/
app.get('/change_username', function(req, res) {
ins = {
  username: myContract.getUsernameByAdd.call()
  };
  var view = Mustache.render(fs.readFileSync(__dirname+'/templates/change_username.html', 'utf-8'), ins);
  res.send(view);
})

/*
* API endpoint for affecting username change in the 
* blockchain. Takes new username as parameter.
*/
app.get('/set_username', function(req, res) {
    myContract.setUsername.sendTransaction(req.query.username);
    res.redirect('/');
})

/*
* This endpoint handles the upload image task.
* It takes an image and sends it to applySmartCrop 
* which creates a thumbnail, adds the original and 
* thumbnail image to IPFS and adds info to blockchain.
* Takes path to image, topic and lat&lng as parameters.
*/
app.post('/upload_image', function(req, res, next) {
    var img = req.files.upload;
    var large_path = file_folder + img.name;
    var small_path = file_folder + 'thumb_' + img.name;
    img.mv(large_path, function(err) {
        applySmartCrop(large_path, small_path, 180, 180, req, res);
    });
})

/*
* Cute page for displaying success/failure messages.
* Takes situation as parameter to decided message.
*/
app.get('/done', function(req, res) {
    sit = req.query.situation;
    if (sit == 'del_failure')
        var ins = {
            message: 'No permission to delete.'
        };
    else if (sit == 'success')
        var ins = {
            message: 'Success!'
        };
    else var ins = {
        message: 'Done!'
    };
    var view = Mustache.render(fs.readFileSync(__dirname + '/templates/done.html', 'utf-8'), ins)
    res.send(view);
})

/*
* End point takes image hash as parameter and 
* deletes it from the blockchain.
*/
app.get('/delete_picture', function(req, res) {
    hash_img = req.query.hash;
    console.log('data', hash_img, myContract.getUsernameByAdd.call(), myContract.canDelete.call(hash_img));
    if (myContract.canDelete.call(hash_img)) {
        console.log('Deleting', hash_img)
        myContract.deleteImage.sendTransaction(hash_img);
        res.redirect('/');
    }
    else {
    res.redirect('/done?situation=del_failure');
    }
})

/*
* Returns the coordinates of an address using
* googlemaps API.
*/
app.post('/coordinates', function(req, res, next) {

    var geocodeParams = {
    "address":    req.body.location
    };

    gmAPI.geocode(geocodeParams, function(err, result)
    { 
        console.log(result);
        if (err) {
            res.send('');
        }
        if(result['status']=='OK') {
            loc = result['results'][0]['geometry']['location'];
            res.send(loc['lat']+','+loc['lng'])
        }
    });
})

app.listen(3051, function () {
  console.log('Example app listening on port 3051!')
})
