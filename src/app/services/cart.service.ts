import {Injectable, EventEmitter} from '@angular/core';
import {MagentoService} from './magento.service';
import {Product} from './../typings/product.d';
import {Totals, Item} from '../typings/totals.d';
import {Http, Response, Headers, RequestOptions} from '@angular/http';
import {Observable} from 'rxjs/Observable';
import {Subscriber} from 'rxjs/Subscriber';

@Injectable()
export class CartService {
  private _STORAGE_KEY = 'cart-id';

  refreshEvent: EventEmitter<any> = new EventEmitter();
  isLoading = false;
  isConfirmed = false;
  totals: Totals;

  constructor(private _magento: MagentoService, private _http: Http) {
    this.refresh();
  }

  reset() {
    localStorage.removeItem(this._STORAGE_KEY);
    this.refresh();
  }

  add(product: Product) {
    return new Observable<Product[]>((observer: Subscriber<any>) => {

      this.getCardId().subscribe(cartId => {

        let body = JSON.stringify({
          cartItem: {
            quote_id: cartId,
            sku     : product.sku,
            qty     : 1,
          }
        });

        let headers = new Headers({
          'Content-Type': 'application/json',
          'Accept'      : 'application/json',
        });
        let options = new RequestOptions({headers: headers});

        return this._http.post(this._magento.apiUrl + 'guest-carts/' + cartId + '/items', body, options)
          .map(response => response.json())
          .subscribe(cartItem => {

            console.log('Add to cart: ', cartItem);

            observer.next(cartItem);

          });
      });

    });
  }

  del(item: Item) {

    this.isLoading = true;

    this.getCardId().subscribe(cartId => {

      let headers = new Headers({
        'Content-Type': 'application/json',
        'Accept'      : 'application/json',
      });
      let options = new RequestOptions({headers: headers});

      return this._http.delete(this._magento.apiUrl + 'guest-carts/' + cartId + '/items/' + item.item_id, options)
        .map(response => response.json())
        .subscribe(isSucceeded => {

          if (isSucceeded) {
            this.refresh();
          } else {
            // Todo: handle error here
            this.isLoading = false;
          }

        });
    });

  }

  getCardId(): Observable<string> {
    var cartId = localStorage.getItem(this._STORAGE_KEY);

    if (cartId) {

      return Observable.of(cartId);

    } else {

      let headers = new Headers({
        'Content-Type': 'application/json',
        'Accept'      : 'application/json',
      });
      let options = new RequestOptions({headers: headers});

      return this._http.post(this._magento.apiUrl + 'guest-carts', '', options)
        .map(response => {

          var cartId = response.json();
          console.log('Cart Id:', cartId);
          localStorage.setItem(this._STORAGE_KEY, cartId);

          return cartId;

        })
        .catch(this._handleError);

    }
  }

  refresh(triggerEvent = false) {

    this.isLoading = true;

    this.getCardId().subscribe(cartId => {

      let headers = new Headers({
        'Content-Type': 'application/json',
        'Accept'      : 'application/json',
      });
      let options = new RequestOptions({headers: headers});

      return this._http.get(this._magento.apiUrl + 'guest-carts/' + cartId + '/totals', options)
        .map(res => <Totals>res.json())
        .catch(this._handleError)
        .subscribe(totals => {

          this.totals = totals;
          console.log('Totals:', this.totals);

          if (triggerEvent) {
            this.refreshEvent.emit(this.totals);
          }

          this.isLoading = false;

        });
    });

  }

  getCartData() {
    return new Observable<any>((observer: Subscriber<any>) => {

      this.getCardId().subscribe(cartId => {

        let headers = new Headers({
          'Content-Type': 'application/json',
          'Accept'      : 'application/json',
        });
        let options = new RequestOptions({headers: headers});

        return this._http.get(this._magento.apiUrl + 'guest-carts/' + cartId, options)
          .map(response => <any>response.json())
          .catch(this._handleError)
          .subscribe(data => {

            observer.next(data);

          });
      });
    });
  }

  private _handleError(error: Response) {
    // in a real world app, we may send the error to some remote logging infrastructure
    // instead of just logging it to the console
    console.error(error.json());
    return Observable.throw(error.json() || 'Server error');
  }
}
