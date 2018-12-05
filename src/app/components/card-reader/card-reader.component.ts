import { Component, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material';
import { BluetoothCore, BrowserWebBluetooth, ConsoleLoggerService } from '@manekinekko/angular-web-bluetooth';
import { Subscription } from 'rxjs';
import { BleService } from './../../services/ble.service';

// make sure we get a singleton instance of each service
const PROVIDERS = [{
  provide: BluetoothCore,
  useFactory: (b, l) => new BluetoothCore(b, l),
  deps: [BrowserWebBluetooth, ConsoleLoggerService]
}, {
  provide: BleService,
  useFactory: (b) => new BleService(b),
  deps: [BluetoothCore]
}];

@Component({
  selector: 'ble-card-reader',
  templateUrl: "./card-reader.component.html",
  styles: [`
  :host {
    display: flex;
    justify-content: center;
    flex-direction: row;
    text-align: center;
  }
  span {
    font-size: 5em;
    position: absolute;
    top: 222px;
    width: 120px;
    display: block;
    text-align: center;
  }
  sup {
    font-size: 24px;
  }
  mat-progress-spinner {
    top: 120px;
  }
  mat-icon {
    position: absolute;
    bottom: 255px;
    font-size: 38px;
  }
  `],
  providers: PROVIDERS
})
export class CardReaderComponent implements OnInit {
  value = null;
  mode = "determinate";
  color = "primary";
  valuesSubscription: Subscription;
  streamSubscription: Subscription;
  deviceSubscription: Subscription;

  get device() {
    return this.service.getDevice();
  }

  constructor(
    public service: BleService,
    public snackBar: MatSnackBar) {

    service.config({
      decoder: (value: DataView) => value.getInt8(0),
      service: 64192,//0xfac0 - e25 service
      characteristic: ""
    })
  }

  ngOnInit() {
    this.getDeviceStatus();

    this.streamSubscription = this.service.stream()
      .subscribe(this.updateValue.bind(this), this.hasError.bind(this));

  }

  getDeviceStatus() {
    this.deviceSubscription = this.service.getDevice()
      .subscribe(device => {
        if (device) {
          this.color = "warn";
          this.mode = "indeterminate";
          this.value = null;
        } else {
          // device not connected or disconnected
          this.value = null;
          this.mode = "determinate";
          this.color = "primary";
        }
      }, this.hasError.bind(this));
  }

  requestValue() {
    this.valuesSubscription = this.service.value()
      .subscribe(null, this.hasError.bind(this));
  }

  updateValue(value: number) {
    console.log('Reading battery level %d', value);
    this.value = value;
    this.mode = "determinate";
  }

  disconnect() {
    this.service.disconnectDevice();
    this.deviceSubscription.unsubscribe();
    this.valuesSubscription.unsubscribe();
  }

  hasError(error: string) {
    this.snackBar.open(error, 'Close');
  }

  ngOnDestroy() {
    this.valuesSubscription.unsubscribe();
    this.deviceSubscription.unsubscribe();
    this.streamSubscription.unsubscribe();
  }
}


