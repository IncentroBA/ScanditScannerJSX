import React, { Component, createElement } from "react";
import {Text,TouchableOpacity,View, Alert, AppState, StyleSheet, Vibration } from "react-native";
import {
    BarcodeCapture,
    BarcodeCaptureOverlay,
    BarcodeCaptureSettings,
    Symbology,
    SymbologyDescription
} from "scandit-react-native-datacapture-barcode";
import {
    Camera,
    CameraSettings,
    DataCaptureContext,
    DataCaptureView,
    FrameSourceState,
    RectangularViewfinder,
    VideoResolution,
    TorchState
} from "scandit-react-native-datacapture-core"; //,TorchState

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black'
  },
  bottom: {
        justifyContent: 'flex-end',
        backgroundColor: 'white',
        alignItems: 'center',
    },
    switchOn: {
       height: 45,
       margin: 5,
       borderRadius: 30,
       backgroundColor: '#de712b',
       alignItems: 'center',
       justifyContent: 'center',
       width: '85%',
   },
   switchOff: {
       height: 45,
       margin: 5,
       borderRadius: 30,
       backgroundColor: 'white',
       borderWidth: 1,
       borderColor: '#de712b',
       alignItems: 'center',
       justifyContent: 'center',
       width: '85%',
   },
   textOn: {
       color: 'white',
       fontSize: 16,
       margin: 50,
       fontWeight: 'bold',
   },
   textOff: {
       color: '#de712b',
       fontSize: 16,
       margin: 50,
       fontWeight: 'bold',
   }

});


export class ScannerScanditJSX extends Component {



    constructor(props) {

        super(props);
        licenseKey = this.props.licensekey;
        this.onDetectHandler = this.onDetect.bind(this);
        this.toggleTorchHandler = this.toggleTorch.bind(this)
        // Create data capture context using your license key.
        this.dataCaptureContext = DataCaptureContext.forLicenseKey(licenseKey);
        this.viewRef = React.createRef();
        this.torchON = true;
    }

    componentDidMount() {
        AppState.addEventListener('change', this.handleAppStateChange);
        this.setupScanning();
    }

    componentWillUnmount() {
        AppState.removeEventListener('change', this.handleAppStateChange);
        this.dataCaptureContext.dispose();
    }

    handleAppStateChange = async (nextAppState) => {
        if (nextAppState.match(/inactive|background/)) {
            this.stopCapture();
        } else {
            this.startCapture();
        }
    }

    onDetect(){
      const { onDetectAction } = this.props;
      if (onDetectAction && onDetectAction.canExecute && !onDetectAction.isExecuting) {
          Vibration.vibrate(400);
          onDetectAction.execute();
          this.barcodeCaptureMode.isEnabled = true; // so for the next scan it is enabled already
      }
    }
    toggleTorch(){
        this.torchON = !this.torchON;
    }

    startCapture() {
        this.startCamera();
        this.barcodeCaptureMode.isEnabled = true;
    }

    stopCapture() {
        this.barcodeCaptureMode.isEnabled = false;
        this.stopCamera();
    }

    stopCamera() {
        if (this.camera) {
            this.camera.switchToDesiredState(FrameSourceState.Off);
        }
    }

    startCamera() {
        if (!this.camera) {
            // Use the world-facing (back) camera and set it as the frame source of the context. The camera is off by
            // default and must be turned on to start streaming frames to the data capture context for recognition.
            this.camera = Camera.default;
            this.dataCaptureContext.setFrameSource(this.camera);

            const cameraSettings = new CameraSettings();
            cameraSettings.preferredResolution = VideoResolution.FullHD;
            //this.camera.desiredTorchState(TorchState.On);
            this.camera.applySettings(cameraSettings);
            this.camera.switchToDesiredState(FrameSourceState.On);
        }


        // Switch camera on to start streaming frames and enable the barcode capture mode.
        // The camera is started asynchronously and will take some time to completely turn on.

    //     requestCameraPermissionsIfNeeded()
    //         .then(() =>)s
    //         .catch(() => BackHandler.exitApp());
     }

    setupScanning() {
        // The barcode capturing process is configured through barcode capture settings
        // and are then applied to the barcode capture instance that manages barcode recognition.
        const settings = new BarcodeCaptureSettings();

        // The settings instance initially has all types of barcodes (symbologies) disabled. For the purpose of this
        // sample we enable a very generous set of symbologies. In your own app ensure that you only enable the
        // symbologies that your app requires as every additional enabled symbology has an impact on processing times.
        //CUSTOMused symbologies by Van Meeuwen
        const symbologiesToUse = [];

        settings.enableSymbologies([
            Symbology.EAN13UPCA,
            Symbology.EAN8,
            Symbology.QR,
            Symbology.Code128
        ]);

        // Some linear/1d barcode symbologies allow you to encode variable-length data. By default, the Scandit
        // Data Capture SDK only scans barcodes in a certain length range. If your application requires scanning of one
        // of these symbologies, and the length is falling outside the default range, you may need to adjust the "active
        // symbol counts" for this symbology. This is shown in the following few lines of code for one of the
        // variable-length symbologies.
        const symbologySettings = settings.settingsForSymbology(Symbology.Code39);
        symbologySettings.activeSymbolCounts = [7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20]

        // Create new barcode capture mode with the settings from above.
        this.barcodeCaptureMode = BarcodeCapture.forContext(this.dataCaptureContext, settings);

        // Register a listener to get informed whenever a new barcode got recognized.
        this.barcodeCaptureListener = {
            didScan: (_, session) => {
                const barcode = session.newlyRecognizedBarcodes[0];
                const symbology = new SymbologyDescription(barcode.symbology);

                // The `alert` call blocks execution until it's dismissed by the user. As no further frames would be processed
                // until the alert dialog is dismissed, we're showing the alert through a timeout and disabling the barcode
                // capture mode until the dialog is dismissed, as you should not block the BarcodeCaptureListener callbacks for
                // longer periods of time. See the documentation to learn more about this.
                this.barcodeCaptureMode.isEnabled = false;

                this.props.barcode.setValue(barcode.data); // set barcode value
                this.onDetect()
                // Alert.alert(
                //     null,
                //     `Scanned: ${barcode.data} (${symbology.readableName})`,
                //     [{ text: 'OK', onPress: () => this.barcodeCaptureMode.isEnabled = true }],
                //     { cancelable: false }
                // );
            }
        };

        this.barcodeCaptureMode.addListener(this.barcodeCaptureListener);

        // Add a barcode capture overlay to the data capture view to render the location of captured barcodes on top of
        // the video preview. This is optional, but recommended for better visual feedback.
        this.overlay = BarcodeCaptureOverlay.withBarcodeCaptureForView(this.barcodeCaptureMode, this.viewRef.current);
        this.overlay.viewfinder = new RectangularViewfinder();
        this.overlay = this.overlay;
    }

    render() {
        return (
           <View style={styles.container}>
            <DataCaptureView style={{ flex: 1 }} context={this.dataCaptureContext} ref={this.viewRef} />

            <View style={styles.bottom}>
                    <TouchableOpacity onPress={this.toggleTorchHandler} style={this.torchON ? styles.switchOff : styles.switchOn}>
                        <Text style={this.torchON ? styles.textOff : styles.textOn}>↯ Lamp {this.torchON ? false : true}</Text>
                    </TouchableOpacity>
                </View>

           </View>
        );
    };
}
