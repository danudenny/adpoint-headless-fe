import {Injectable} from '@angular/core';
import {MagentoService} from './magento.service';
import {Product} from './../typings/product.d';
import {Http, Response, Headers, RequestOptions, URLSearchParams} from '@angular/http';
import {Observable} from 'rxjs/Observable';

@Injectable()
export class CatalogService {
  public products: Product[];

  constructor(private _magento: MagentoService, private _http: Http) {
  }

  getProducts() {
    if (this.products) {
      return;
    }

    let headers = new Headers({
      'Content-Type': 'application/json',
      'Accept'      : 'application/json',
    });

    var search = new URLSearchParams();
    search.set('searchCriteria[filter_groups][0][filters][0][field]', 'visibility');
    search.set('searchCriteria[filter_groups][0][filters][0][value]', '4');

    search.set('searchCriteria[filter_groups][1][filters][0][field]', 'type_id');
    search.set('searchCriteria[filter_groups][1][filters][0][value]', 'simple');
    search.set('searchCriteria[filter_groups][1][filters][1][field]', 'type_id');
    search.set('searchCriteria[filter_groups][1][filters][1][value]', 'downloadable');

    search.set('searchCriteria[filter_groups][2][filters][0][field]', 'status');
    search.set('searchCriteria[filter_groups][2][filters][0][value]', '1');

    search.set('searchCriteria[pageSize]', '100');
    search.set('searchCriteria[currentPage]', '1');

    let options = new RequestOptions({headers: headers, search: search});

    return this._http.get('https://m2.rocwang.me/rest/V1/products', options)
      .map(response => response.json())
      .catch(this._handleError)
      .subscribe(data => {

        var products = <Product[]> data.items;
        console.log('Products: ', products);

        // Find the product image
        products.forEach((product: any) => {
          product.custom_attributes.forEach((attr: any) => {
            if (attr.attribute_code === 'small_image') {
              product.imgSrc = this._magento.baseUrl + 'pub/media/catalog/product' + attr.value;
            }
          });

          product.isAdding = false;
        });

        this.products = products;

      });
  }

  private _handleError(error: Response) {
    // in a real world app, we may send the error to some remote logging infrastructure
    // instead of just logging it to the console
    console.error(error.json());
    return Observable.throw(error.json() || 'Server error');
  }
}
