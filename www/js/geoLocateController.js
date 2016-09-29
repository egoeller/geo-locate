angular.module('geoApp')
    .controller("geoLocateController", function ($scope, $timeout, $cordovaDeviceOrientation, $cordovaGeolocation, $cordovaCamera, $cordovaFile) {


        var ctrl = this;

        //declare variables
        ctrl.direction = '';
        ctrl.gps = '';
        ctrl.fullPath = '';
        //ctrl.overlayExists = false;

        //make functions public
        ctrl.testFunction = testFunction;
        ctrl.getCompass = getCompass;
        ctrl.convertTimeStamp = convertTimestamp;
        ctrl.degToCompass = degToCompass;
        ctrl.getGPS = getGPS;
        ctrl.getPhoto = getPhoto;
        ctrl.createOverlay = createOverlay;
        ctrl.createDir = createDir;
        ctrl.saveImage64 = saveImage64;
        activate();



        function activate() {
            console.log("activating controller");
            createDir();

        }


        function testFunction() {
            console.log("this is a test function");
        }

        function getCompass() {
            $cordovaDeviceOrientation.getCurrentHeading()
                .then(function (result) {
                    var magneticHeading = result.magneticHeading;
                    var trueHeading = result.trueHeading;
                    var accuracy = result.headingAccuracy;
                    ctrl.timeStamp = result.timestamp;
                    console.log(magneticHeading, trueHeading, accuracy, ctrl.timeStamp);
                    degToCompass(magneticHeading);
                    ctrl.timeStamp = convertTimestamp(ctrl.timeStamp);
                    console.log(ctrl.timeStamp);


                }, function (err) {
                    // An error occurred
                    console.log(err);
                });
        }


        function degToCompass(num) {
            var val = Math.floor((num / 22.5) + 0.5);
            var arr = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
            ctrl.direction = arr[(val % 16)];
            console.log(ctrl.direction);
        }


        function convertTimestamp(timestamp) {
            var d = new Date(timestamp), // Convert the passed timestamp to milliseconds
                yyyy = d.getFullYear(),
                mm = ('0' + (d.getMonth() + 1)).slice(-2), // Months are zero based. Add leading 0.
                dd = ('0' + d.getDate()).slice(-2), // Add leading 0.
                hh = d.getHours(),
                h = hh,
                min = ('0' + d.getMinutes()).slice(-2), // Add leading 0.
                ampm = 'AM',
                time;

            if (hh > 12) {
                h = hh - 12;
                ampm = 'PM';
            } else if (hh === 12) {
                h = 12;
                ampm = 'PM';
            } else if (hh == 0) {
                h = 12;
            }

            // ie: 2013-02-18, 8:35 AM	
            time = yyyy + '-' + mm + '-' + dd + ', ' + h + ':' + min + ' ' + ampm;

            return time;
        }


        function getGPS() {
            /*var posOptions = {
                timeout: 10000,
                enableHighAccuracy: false
            };*/
            $cordovaGeolocation
            //.getCurrentPosition(posOptions)
                .getCurrentPosition()
                .then(function (position) {
                    var lat = position.coords.latitude
                    var long = position.coords.longitude
                    console.log(lat, long);
                    ctrl.gps = 'Lat: ' + lat + ' , Long: ' + long;
                    console.log(ctrl.gps);
                }, function (err) {
                    // error
                    console.log(err);
                });
        }

        function getPhoto() {
            console.log('Getting camera');
            getCompass();
            getGPS();
            $cordovaCamera.getPicture({
                quality: 75,
                targetWidth: 320,
                targetHeight: 320,
                saveToPhotoAlbum: false
            }).then(function (imageURI) {
                console.log(imageURI);
                console.log(imageURI);
                ctrl.lastPhoto = imageURI;
                //ctrl.overlayExists = true;
                createOverlay();
                $timeout(function () {
                    createOverlay();
                }, 1500);

            }, function (err) {
                console.err(err);
            });
        }


        function createOverlay() {

            var starting = ctrl.lastPhoto;
            ctrl.image = starting;
            ctrl.textOverlay = 'GPS:' + ctrl.gps + '\nDirection:' + ctrl.direction + '\nTimestamp:' + ctrl.timeStamp;
            console.log(ctrl.textOverlay);
            console.log(starting);

            var canvas = document.getElementById('tempCanvas');
            var context = canvas.getContext('2d');

            var source = new Image();
            source.src = starting;
            canvas.width = source.width;
            canvas.height = source.height;

            console.log(canvas);

            context.drawImage(source, 0, 0);

            context.font = "100px impact";
            textWidth = context.measureText(ctrl.frase).width;

            if (textWidth > canvas.offsetWidth) {
                context.font = "15px impact";
            }
            context.textAlign = 'center';
            context.fillStyle = 'white';

            context.wrapText(ctrl.textOverlay, canvas.width / 2, canvas.height * 0.8, 320, 16);

            //context.fillText(ctrl.textOverlay, canvas.width / 2, canvas.height * 0.8);

            var imgURI = canvas.toDataURL();
            console.log(imgURI);

            //ctrl.image = imgURI;
            //console.log(ctrl.image);
            $timeout(function () {
                ctrl.image = imgURI;
                console.log(ctrl.image);
            }, 200);
        }


        function createDir() {
            //need deviceReady for plugin to work
            document.addEventListener("deviceready", function () {
                $cordovaFile.createDir(cordova.file.externalRootDirectory, 'geoLocationApp', true)
                    .then(function (success) {
                        // success
                        ctrl.fullPath = cordova.file.externalRootDirectory + 'geoLocationApp';
                        console.log(ctrl.fullPath);
                        console.log("success plugin", success);
                        console.log("creating Directory");
                        console.log("directory is: " + cordova.file.externalRootDirectory);
                    }, function (error) {
                        // error
                        console.log(error)
                    });
            }, false);
        }


        function saveImage64() {
            console.log('save image 64');
            document.addEventListener("deviceready", function () {

                var params = {
                    data: ctrl.image,
                    prefix: 'geoApp_',
                    format: 'JPG',
                    quality: 100,
                    mediaScanner: true
                };
                window.imageSaver.saveBase64Image(params,
                    function (filePath) {
                        console.log('File saved on ' + filePath);
                    },
                    function (msg) {
                        console.error(msg);
                    }
                );
            }, false);
        }



        CanvasRenderingContext2D.prototype.wrapText = function (text, x, y, maxWidth, lineHeight) {

            var lines = text.split("\n");

            for (var i = 0; i < lines.length; i++) {

                var words = lines[i].split(' ');
                var line = '';

                for (var n = 0; n < words.length; n++) {
                    var testLine = line + words[n] + ' ';
                    var metrics = this.measureText(testLine);
                    var testWidth = metrics.width;
                    if (testWidth > maxWidth && n > 0) {
                        this.fillText(line, x, y);
                        line = words[n] + ' ';
                        y += lineHeight;
                    } else {
                        line = testLine;
                    }
                }

                this.fillText(line, x, y);
                y += lineHeight;
            }
        }









    }); //end of CTRL
