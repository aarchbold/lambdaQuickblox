console.log('Checking newly uploaded file');
var AWS = require('aws-sdk');
var QB = require('quickblox');
var s3 = new AWS.S3({apiVersion: '2006-03-01'});
var eltr = new AWS.ElasticTranscoder({
    apiVersion: '2012-09-25',
    region: 'us-west-2'
});
// ID of pipeline
var pipelineId = '1436222956734-i4k4lq';
// ID of ET's web output preset
// HLS Presets
var HLS400k = '1351620000001-200050';
var HLS600k = '1351620000001-200040';
var HLS1m = '1351620000001-200030';
var HLS15m = '1351620000001-200020';
var HLS2m = '1351620000001-200010';
var HLS160k = '1351620000001-200060';
var HLS64k = '1351620000001-200071';

// Our custom WebM format
var webMPresetCustom = 'webMPreset';
// Our custom ogg format
var oggPresetCustom = 'oggPreset';
// configure Quickblox
var QBconfig = {
    ssl: false,
    debug: false
};
var loginCreds = {email: 'pulsegrenade@gmail.com', password: '2sc00ps!'};

// initialize a Quickblox instance
QB.init(23981, 'gCO3vctnZqAE4Vp', 'X4ws9XmgNhH3ypz', QBconfig);
 
exports.handler = function(event, context) {
   // Get the object from the event and show its content type
   var bucket = event.Records[0].s3.bucket.name;
   var key = event.Records[0].s3.object.key;
   
   if (bucket != 'arch2') {
     console.log('Not my-bucket')
   }
   s3.headObject({
       Bucket:bucket,
       Key:key
     },
      function(err, data) {
        if (err) {
            console.log(err);
           console.log('error getting object ' + key + ' from bucket ' + bucket +
               '. Make sure they exist and your bucket is in the same region as this function.');
           context.done('ERROR', 'error getting file' + err);
        }
        else {
            console.log(data);
          if (data.ContentType == 'video/quicktime') {
            console.log('Found new video: ' + key + ', sending to ET');
            var today = new Date();
            var dd = today.getDate();
            var mm = today.getMonth() + 1;
            var yyyy = today.getFullYear();
            if (dd < 10) {
                dd = '0' + dd;
            };
            if (mm < 10) {
                mm = '0' + mm;
            };
            today = dd + '-' + mm + '-' + yyyy + '/';
            var newKey = key.split('.')[0];
            var params = {
                PipelineId: pipelineId,
                OutputKeyPrefix: key.split('.')[0] + '/',
                Input: {
                  Key: key,
                  FrameRate: 'auto',
                  Resolution: 'auto',
                  AspectRatio: 'auto',
                  Interlaced: 'auto',
                  Container: 'auto'
                },
                Outputs: [
                  {
                    Key: 'video_400k_',
                    ThumbnailPattern: 'thumb_' + newKey + '-{count}',
                    PresetId: HLS400k,
                    SegmentDuration: '10',
                    Rotate: 'auto'
                  },
                  {
                    Key: 'video_600k_',
                    ThumbnailPattern: '',
                    PresetId: HLS600k,
                    SegmentDuration: '10',
                    Rotate: 'auto'
                  },
                  {
                    Key: 'video_1m_',
                    ThumbnailPattern: '',
                    PresetId: HLS1m,
                    SegmentDuration: '10',
                    Rotate: 'auto'
                  },
                  {
                    Key: 'video_15m_',
                    ThumbnailPattern: '',
                    PresetId: HLS15m,
                    SegmentDuration: '10',
                    Rotate: 'auto'
                  },
                  {
                    Key: 'video_2m_',
                    ThumbnailPattern: '',
                    PresetId: HLS2m,
                    SegmentDuration: '10',
                    Rotate: 'auto'
                  },
                  {
                    Key: 'video_160k_',
                    ThumbnailPattern: '',
                    PresetId: HLS160k,
                    SegmentDuration: '10',
                    Rotate: 'auto'
                  },
                  {
                    Key: 'video_64k_',
                    ThumbnailPattern: '',
                    PresetId: HLS64k,
                    SegmentDuration: '10',
                    Rotate: 'auto'
                  }
                ],
                Playlists: [
                   {
                      Format: 'HLSv3',
                      Name: 'index',
                      OutputKeys: [
                         'video_2m_',
                         'video_15m_',
                         'video_1m_',
                         'video_600k_',
                         'video_400k_',
                         'video_160k_',
                         'video_64k_'
                      ]
                   }
                ]
              };
            eltr.createJob(params, function (error, data) {
            if (error) {
              console.log('Failed to send new video ' + key + ' to ET');
              console.log(error);
              context.done(null,'Epic fail!!!');
            } else {
              function updateUrl() {
                  var vidData = {
                      _id: key.split('.')[0], // id of the db item we want to update
                      url: key
                  };
                  QB.data.update("Videos", vidData, function(err, response){
                      console.log('updated DB object');
                      context.done(null,'GREAT SUCCESS!!!');
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
              // Start a chain of functions that will ultimately update Quickblox
              QB.createSession(function(err, result) {
                  // callback function
                  console.log('Session created: Read access only');
                  //getVids();
                  // log in as administrator
                  logInAsAdmin();
              });
              console.log(data);
              console.log('Now attempt to contact QB.');
            }
          });
          } else {
            console.log('Upload ' + key + 'was not video');
            console.log(JSON.stringify(data.Metadata));
            context.done(null,'Not a video, bro');
          }
        }
      }
   );
};