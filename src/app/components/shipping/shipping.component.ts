import {Component, OnInit} from '@angular/core';
import {ShippingService} from '../../services/shipping.service';
import {CountryComponent} from '../country/country.component';
import {PaymentService} from '../../services/payment.service';

@Component({
  selector   : 'shipping',
  templateUrl: 'app/components/shipping/shipping.component.html',
  styleUrls  : ['app/components/shipping/shipping.component.css'],
  directives : [CountryComponent],
})
export class ShippingComponent implements OnInit {

  constructor(public shipping: ShippingService, public payment: PaymentService) {
  }

  ngOnInit() {
    if (!this.shipping.availableMethods.length) {
      this.shipping.loadMethodsByAddress();
    }
  }

  save() {
    setTimeout(() => this.shipping.save(), 300);
  }
}
