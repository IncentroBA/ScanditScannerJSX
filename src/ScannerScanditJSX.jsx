import React, { Component, createElement } from "react";
import { Alert, AppState, BackHandler } from "react-native";
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
    VideoResolution
} from "scandit-react-native-datacapture-core";

import { requestCameraPermissionsIfNeeded } from "./camera-permission-handler";

export class ScannerScanditJSX extends Component {
    constructor() {
        super();

        // Create data capture context using your license key.
        this.dataCaptureContext = DataCaptureContext.forLicenseKey("Aawv+RI4MgB0EhR+jgn8qaAi8GllP2X6Ti7giLYSMMeLIjp73WsHAn5L90WnPLgn/zLiuWFrHdIqNHl1pmC/Zht7JRBLa2xEKyoUxCJlF+yOccR9jViUOm15WObcREYQM0yExu5i3ypqcidbjXjEYlBRFL95aPyTo1Drev5F/WnTSwAc52BUqmt2KQj1SpenZ3sQu0lZdnsUR6VdKWVFup5BU18heAUK5mKhYUJCwBIhZO26W0+P7+4XzvQvR2pwdUWLZTFtVOMYbBSjfEIO5o9YqJ7fS0BDsAxPqRtvTJOYVdJEp1Rq1h5u4AjyVdIpc0wRaiN5QfVJZnU0rkljsgJERCKkVJ+SOH/w269taL6pVpnUB1fp/X9DDuKUc39bWlswuYhmtO+Cdh9lzGHojkZskQYbIIIaBnpA8lBwAxZdR6j5rUCHlslB7fM+JZOSLHtqXrgtwx4MP1URsmGUc4lxdYSPS0LILw3bm9FEu6C0IKmDki9GmZNngyzlLFCKGBKokNMsU1G7J6pDVhbGgCowkEGR6AxjfuTZFkt+AKtmamywhJkx/ruNiKk53jTbZBHNKXUWlMv8BhvqHO8mkpntSj16/xGk1VBQJduMMXR+1HjvShPfDe6tLI2HcmGCgdDjFRTh+qmEp4RdBhZ9SL878PGes7wmDwC/EcXzpdpm6bHixAVSAzo4o8PJ7k5azhnl2Z34ZetbHtdOmOz23KXYVdzEaorXMPrDTuFkHDClR6xPcCK4EJDn+GCfhiAqZq6hZxCmDT4R1IUh9A9+etJFVRMnRW9hwbgKxZ7dVWCUyyPRxNpXC8smge5yNpJqZhyabBExcuxAgpk4ln5IRVYvzc/SHacMvWdO/KRTjAAalWq8cDtpe1KHHiGw/8tmGpqL5PBtn5gJWJDsecNJlV6Gc96aEYSAirOJTNgYksTdPdNN1C5aij4lsS51SQShdr2ke24jXEPnh6+aRj79hQR/w1DwhP0j8xD6Fwbf/FEjsQM3s1KQRxzMy4CYKeuAW0HQ7QpaLufYsyjIjRsPuFj0O/5+fpisxxp1GGcWU7iMlG4sVlZv1MK/fHs1rrXYbZxSEllLDHrJScV2jOXAjhSJCgVyoRQSwnHYDUqqQzVIIuFAyLfN9rvTKHgUVkXXDuqerJcQaKB8Nbhir26cKqk7gmyvgeJaeVoPZEbYvjiptUOBQV2MlMf0JpgHbcI=");
        this.viewRef = React.createRef();
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
            this.camera.applySettings(cameraSettings);
        }

        // Switch camera on to start streaming frames and enable the barcode capture mode.
        // The camera is started asynchronously and will take some time to completely turn on.
        requestCameraPermissionsIfNeeded()
            .then(() => this.camera.switchToDesiredState(FrameSourceState.On))
            .catch(() => BackHandler.exitApp());
    }

    setupScanning() {
        // The barcode capturing process is configured through barcode capture settings
        // and are then applied to the barcode capture instance that manages barcode recognition.
        const settings = new BarcodeCaptureSettings();

        // The settings instance initially has all types of barcodes (symbologies) disabled. For the purpose of this
        // sample we enable a very generous set of symbologies. In your own app ensure that you only enable the
        // symbologies that your app requires as every additional enabled symbology has an impact on processing times.
        settings.enableSymbologies([
            Symbology.EAN13UPCA,
            Symbology.EAN8,
            Symbology.UPCE,
            Symbology.QR,
            Symbology.DataMatrix,
            Symbology.Code39,
            Symbology.Code128,
            Symbology.InterleavedTwoOfFive,
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

                Alert.alert(
                    null,
                    `Scanned: ${barcode.data} (${symbology.readableName})`,
                    [{ text: 'OK', onPress: () => this.barcodeCaptureMode.isEnabled = true }],
                    { cancelable: false }
                );
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
            <DataCaptureView style={{ flex: 1 }} context={this.dataCaptureContext} ref={this.viewRef} />
        );
    };
}
