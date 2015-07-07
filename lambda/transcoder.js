console.log('Checking newly uploaded file');
var AWS = require('aws-sdk');
var s3 = new AWS.S3({apiVersion: '2006-03-01'});
var eltr = new AWS.ElasticTranscoder({
    apiVersion: '2012-09-25',
    region: 'us-west-2'
});
// ID of pipeline
var pipelineId = '1431419301332-5m0ghn';
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
 
exports.handler = function(event, context) {
   // Get the object from the event and show its content type
   var bucket = event.Records[0].s3.bucket.name;
   var key = event.Records[0].s3.object.key;
   
   if (bucket != 'elastic.transcoder.in.west') {
     console.log('Not my-bucket')
   }
   s3.getObject({
       Bucket:bucket,
       Key:key
     },
      function(err, data) {
        if (err) {
           console.log('error getting object ' + key + ' from bucket ' + bucket +
               '. Make sure they exist and your bucket is in the same region as this function.');
           context.done('ERROR', 'error getting file' + err);
        }
        else {
          if (data.Metadata.type == 'video') {
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
                OutputKeyPrefix: today,
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
                    Key: 'HLS400k-' + newKey,
                    ThumbnailPattern: 'thumbs-' + newKey + '-{count}',
                    PresetId: HLS400k,
                    Rotate: 'auto',
                    UserMetadata: {
                      uuid: data.Metadata.uuid,
                      video_type: 'ts'
                    }
                  },
                  {
                    Key: 'HLS600k-' + newKey,
                    ThumbnailPattern: '',
                    PresetId: HLS600k,
                    Rotate: 'auto',
                    UserMetadata: {
                      uuid: data.Metadata.uuid,
                      video_type: 'ts'
                    }
                  },
                  {
                    Key: 'HLS1m-' + newKey,
                    ThumbnailPattern: '',
                    PresetId: HLS1m,
                    Rotate: 'auto',
                    UserMetadata: {
                      uuid: data.Metadata.uuid,
                      video_type: 'ts'
                    }
                  },
                  {
                    Key: 'HLS15m-' + newKey,
                    ThumbnailPattern: '',
                    PresetId: HLS15m,
                    Rotate: 'auto',
                    UserMetadata: {
                      uuid: data.Metadata.uuid,
                      video_type: 'ts'
                    }
                  },
                  {
                    Key: 'HLS2m-' + newKey,
                    ThumbnailPattern: '',
                    PresetId: HLS2m,
                    Rotate: 'auto',
                    UserMetadata: {
                      uuid: data.Metadata.uuid,
                      video_type: 'ts'
                    }
                  },
                  {
                    Key: 'HLS160k-' + newKey,
                    ThumbnailPattern: '',
                    PresetId: HLS160k,
                    Rotate: 'auto',
                    UserMetadata: {
                      uuid: data.Metadata.uuid,
                      video_type: 'ts'
                    }
                  },
                  {
                    Key: 'HLS64k-' + newKey,
                    ThumbnailPattern: '',
                    PresetId: HLS64k,
                    Rotate: 'auto',
                    UserMetadata: {
                      uuid: data.Metadata.uuid,
                      video_type: 'ts'
                    }
                  }
                ]
              };
            eltr.createJob(params, function (error, data) {
            if (error) {
              console.log('Failed to send new video ' + key + ' to ET');
              console.log(error);
            } else {
              console.log(data);
            }
            context.done(null,'');
          });
          } else {
            console.log('Upload ' + key + 'was not video');
            console.log(JSON.stringify(data.Metadata));
          }
        }
      }
   );
};