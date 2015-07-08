console.log('Loading function');

var aws = require('aws-sdk'),
    s3 = new aws.S3({ apiVersion: '2006-03-01' }),
    QB = require('quickblox'),
    QBconfig = {
        ssl: false,
        debug: false
    },
    loginCreds = {email: 'pulsegrenade@gmail.com', password: '2sc00ps!'},
    // ID of pipeline
    pipelineId = '1431419301332-5m0ghn';

// initialize a Quickblox instance
QB.init(23981, 'gCO3vctnZqAE4Vp', 'X4ws9XmgNhH3ypz', QBconfig);


exports.handler = function(event, context) {
    console.log('Received event:', JSON.stringify(event, null, 2));

    // Get the object from the event and show its content type
    var bucket = event.Records[0].s3.bucket.name;
    var key = event.Records[0].s3.object.key;
    var params = {
        Bucket: bucket,
        Key: key
    };
    var s3Id = key.split('.')[0];
    var vidData = {
        _id: s3Id, // id of the db item we want to update
        url: key
    };

    s3.getObject(params, function(err, data) {
        function updateUrl() {
            QB.data.update("Videos", vidData, function(err, response){
                console.log('updated DB object');
                context.succeed(s3Id);
            });
        }
        function logInAsAdmin() {
            QB.login(loginCreds, function(err, result) {
                // callback function
                console.log('logged in as pulsegrenade@gmail.com');
                console.log('Now has write access');
                //console.log(err);
                updateUrl();
            });
        }
        if (err) {
            console.log("Error getting object " + key + " from bucket " + bucket +
                ". Make sure they exist and your bucket is in the same region as this function.");
            context.fail("Error getting file: " + err);
        } else {
            console.log('CONTENT TYPE:', data.ContentType);
            console.log('FILENAME:', s3Id);

            // Start a chain of functions that will ultimately update Quickblox
            QB.createSession(function(err, result) {
                // callback function
                console.log('Session created: Read access only');
                //getVids();
                // log in as administrator
                logInAsAdmin();
            });

        }
    });
};