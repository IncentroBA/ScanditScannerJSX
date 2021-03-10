import React, { Component, createElement } from "react";
import {Text,TextInput,TouchableOpacity,View, Alert, AppState, StyleSheet, Vibration } from "react-native";
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
} from "scandit-react-native-datacapture-core";
import { requestCameraPermissionsIfNeeded } from "./camera-permission-handler.js";

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
   },
   textBox: {
        backgroundColor: 'white',
        alignItems: 'center',
    },
    textInput: {
        height: 45,
        margin: 5,
        width: 300,
        borderBottomWidth: 1,
        borderBottomColor: '#de712b',
    },
    textBarcode: {
        color: '#de712b',
        fontSize: 16,
        fontWeight: 'bold',
    }

});


export class ScannerScanditJSX extends Component {



    constructor(props) {

        super(props);
        licenseKey = this.props.licensekey;
        this.onDetectHandler = this.onDetect.bind(this);
        this.toggleTorchHandler = this.toggleTorch.bind(this);
        this.manualBarcodeHandler = this.manualBarcode.bind(this);
        // Create data capture context using your license key.
        this.dataCaptureContext = DataCaptureContext.forLicenseKey(licenseKey);
        this.viewRef = React.createRef();
        this.torchON = true;
        this.autoDetect = true;
        this.state = {
          textboxValue : ''
        }
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

    manualBarcode() {
       this.props.barcode.setValue(this.state.textboxValue);
       this.onDetect();
   }

    toggleTorch(){
        this.torchON = !this.torchON;
    }

    toggleAutoDetect(){
        this.setState({autoDetect: !this.state.autoDetect})
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
        requestCameraPermissionsIfNeeded()
             .then(() => this.camera.switchToDesiredState(FrameSourceState.On))
             .catch(() => this.camera.switchToDesiredState(FrameSourceState.Off));
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
        if(this.props.QR){
          symbologiesToUse.push(Symbology.QR);
        }
        if(this.props.EAN8){
          symbologiesToUse.push(Symbology.EAN8);
        }
        if(this.props.EAN13UPCA){
          symbologiesToUse.push(Symbology.EAN13UPCA);
        }
        if(this.props.Code128){
          symbologiesToUse.push(Symbology.Code128);
        }
        if(this.props.Code39){
          symbologiesToUse.push(Symbology.Code39);
        }
        if(this.props.Code93){
          symbologiesToUse.push(Symbology.Code93);
        }
        if(this.props.Code11){
          symbologiesToUse.push(Symbology.Code11);
        }
        if(this.props.Code25){
          symbologiesToUse.push(Symbology.Code25);
        }
        if(this.props.UPCE){
          symbologiesToUse.push(Symbology.UPCE);
        }
        if(this.props.Codabar){
          symbologiesToUse.push(Symbology.Codabar);
        }
        if(this.props.InterleavedTwoOfFive){
          symbologiesToUse.push(Symbology.InterleavedTwoOfFive);
        }
        if(this.props.MSIPlessey){
          symbologiesToUse.push(Symbology.MSIPlessey);
        }
        if(this.props.DataMatrix){
          symbologiesToUse.push(Symbology.DataMatrix);
        }
        if(this.props.Aztec){
          symbologiesToUse.push(Symbology.Aztec);
        }
        if(this.props.MaxiCode){
          symbologiesToUse.push(Symbology.MaxiCode);
        }
        if(this.props.DotCode){
          symbologiesToUse.push(Symbology.DotCode);
        }
        if(this.props.KIX){
          symbologiesToUse.push(Symbology.KIX);
        }
        if(this.props.RM4SCC){
          symbologiesToUse.push(Symbology.RM4SCC);
        }
        if(this.props.GS1Databar){
          symbologiesToUse.push(Symbology.GS1Databar);
        }
        if(this.props.GS1DatabarExpanded){
          symbologiesToUse.push(Symbology.GS1DatabarExpanded);
        }
        if(this.props.GS1DatabarLimited){
          symbologiesToUse.push(Symbology.GS1DatabarLimited);
        }
        if(this.props.PDF417){
          symbologiesToUse.push(Symbology.PDF417);
        }
        if(this.props.MicroPDF417){
          symbologiesToUse.push(Symbology.MicroPDF417);
        }
        if(this.props.MicroQR){
          symbologiesToUse.push(Symbology.MicroQR);
        }
        if(this.props.Code32){
          symbologiesToUse.push(Symbology.Code32);
        }
        if(this.props.Lapa4SC){
          symbologiesToUse.push(Symbology.Lapa4SC);
        }
        if(this.props.IATATwoOfFive){
          symbologiesToUse.push(Symbology.IATATwoOfFive);
        }
        if(this.props.MatrixTwoOfFive){
          symbologiesToUse.push(Symbology.MatrixTwoOfFive);
        }
        if(this.props.USPSIntelligentMail){
          symbologiesToUse.push(Symbology.USPSIntelligentMail);
        }

        // [
        //     Symbology.EAN13UPCA,
        //     Symbology.EAN8,
        //     Symbology.QR,
        //     Symbology.Code128
        // ]
        settings.enableSymbologies(symbologiesToUse);

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
                   {!this.props.enableTorch ?  <View></View> :
                    <TouchableOpacity onPress={this.toggleTorchHandler} style={this.torchON ? styles.switchOff : styles.switchOn}>
                        <Text style={this.torchON ? styles.textOff : styles.textOn}>↯ Lamp {this.torchON ? ' aan' : ' uit'}</Text>
                    </TouchableOpacity>
                  }
                  {!this.props.enableManualDetection ? <View></View> :
                    <View style={styles.textBox}>
                        <Text style={styles.textBarcode}>Barcode: </Text>
                        <TextInput style={styles.textInput} placeholder="Scan of vul handmatig" value={this.state.textboxValue}  onChangeText={(text) => this.setState({textboxValue: text})} />
                        <TouchableOpacity onPress={this.manualBarcodeHandler} style={styles.switchOn}>
                            <Text style={styles.textOn}>Naar machine</Text>
                        </TouchableOpacity>
                    </View>
                    }
              </View>

           </View>
        );
    };
}
