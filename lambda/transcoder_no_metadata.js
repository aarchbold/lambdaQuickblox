console.log('Checking newly uploaded file');
var AWS = require('aws-sdk');
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
                    SegmentDuration: '5',
                    Rotate: 'auto'
                  },
                  {
                    Key: 'HLS600k-' + newKey,
                    ThumbnailPattern: '',
                    PresetId: HLS600k,
                    SegmentDuration: '5',
                    Rotate: 'auto'
                  },
                  {
                    Key: 'HLS1m-' + newKey,
                    ThumbnailPattern: '',
                    PresetId: HLS1m,
                    SegmentDuration: '5',
                    Rotate: 'auto'
                  },
                  {
                    Key: 'HLS15m-' + newKey,
                    ThumbnailPattern: '',
                    PresetId: HLS15m,
                    SegmentDuration: '5',
                    Rotate: 'auto'
                  },
                  {
                    Key: 'HLS2m-' + newKey,
                    ThumbnailPattern: '',
                    PresetId: HLS2m,
                    SegmentDuration: '5',
                    Rotate: 'auto'
                  },
                  {
                    Key: 'HLS160k-' + newKey,
                    ThumbnailPattern: '',
                    PresetId: HLS160k,
                    Rotate: 'auto'
                  },
                  {
                    Key: 'HLS64k-' + newKey,
                    ThumbnailPattern: '',
                    PresetId: HLS64k,
                    Rotate: 'auto'
                  }
                ],
                Playlists: [
                   {
                      Format: 'HLSv3',
                      Name: newKey + '.m3u8',
                      OutputKeys: [
                         'HLS2m-' + newKey,
                         'HLS15m-' + newKey,
                         'HLS1m-' + newKey,
                         'HLS600k-' + newKey,
                         'HLS400k-' + newKey
                      ]
                   }
                ]
              };
            eltr.createJob(params, function (error, data) {
            if (error) {
              console.log('Failed to send new video ' + key + ' to ET');
              console.log(error);
              context.done(null,'');
            } else {
              console.log(data);
              context.done(null,'');
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