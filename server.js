var express = require('express');
var app = express();
var port = process.env.PORT || 3000;
var fs = require('fs');
var multer = require('multer');
var AWS = require('aws-sdk');

var accessKeyId = '{accessKeyId}';
var secretAccessKey = '{secretAccessKey}';

AWS.config.update({
  accessKeyId: accessKeyId,
  secretAccessKey: secretAccessKey
});

var s3 = new AWS.S3();

// template engine
app.use(express.static(__dirname + "/views"));
app.engine('html', require('ejs')
  .renderFile);
app.set('view engine', 'html');

//multers disk storage settings
var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './uploads/')
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname)
  }
});


//multer settings
var upload = multer({ 
  storage: storage
})
.any();


/** API path that will upload the files */
app.post('/upload', function (req, res) {
  upload(req, res, function (err) {
    if (err) {
      res.json({ error_code: 1, err_desc: err });
      return;
    }
    res.json({ error_code: 0, err_desc: null });

    var _file = req.files[0];
    console.log("file name - " + _file.filename);

    // get the event id
    console.log("Event Id - " + req.body.eventId);

    var path = "./uploads/" + _file.originalname;
    fs.readFile(path, "utf-8", function (err, file_buffer) {
      var params = {
        Bucket: '{your-bucketname}',
        Key: "images/events/" + _file.filename,
        Body: file_buffer
      };

      s3.putObject(params, function (perr, pres) {
        if (perr) {
          console.log("Error uploading data: ", perr);
        } else {
          console.log("Successfully uploaded data to your bucket");
        }
      });
    });

    // removing local copy
    fs.unlink(path, function(err){
      if(err) {
        console.log(err);
        throw err;
      }
      console.log("local file deleted");
    });
  });
});

// =====================================
// run server
app.listen(port, function () {
  console.log('The server is running at port:' + port);
});