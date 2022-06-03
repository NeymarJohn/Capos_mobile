import { Component, OnInit, ViewEncapsulation, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActionSheetController, NavController, Platform, PopoverController } from '@ionic/angular';
import { AutoCompleteOptions, AutoCompleteComponent } from 'ionic4-auto-complete';
import { ChooseCustomerComponent } from 'src/app/components/choose-customer/choose-customer.component';
import { ConfirmPasswordComponent } from 'src/app/components/confirm-password/confirm-password.component';
import { DiscountComponent } from 'src/app/components/discount/discount.component';
import { PayAmountComponent } from 'src/app/components/pay-amount/pay-amount.component';
import { PayChangeComponent } from 'src/app/components/pay-change/pay-change.component';
import { QuantityComponent } from 'src/app/components/quantity/quantity.component';
import { SaleNoteComponent } from 'src/app/components/sale-note/sale-note.component';
import { DrawerNoteComponent } from 'src/app/components/drawer-note/drawer-note.component';
import { UnfulfilledSaleComponent } from 'src/app/components/unfulfilled-sale/unfulfilled-sale.component';
import { Cart } from 'src/app/_classes/cart.class';
import { CartProduct } from 'src/app/_classes/cart_product.class';
import { Openclose } from 'src/app/_classes/openclose.class';
import { Payment } from 'src/app/_classes/payment.class';
import { Product } from 'src/app/_classes/product.class';
import { Constants } from 'src/app/_configs/constants';
import { AlertService } from 'src/app/_services/alert.service';
import { AuthService } from 'src/app/_services/auth.service';
import { CartService } from 'src/app/_services/cart.service';
import { LoadingService } from 'src/app/_services/loading.service';
import { SearchProductService } from 'src/app/_services/search-product.service';
import { ToastService } from 'src/app/_services/toast.service';
import { UtilService } from 'src/app/_services/util.service';
import * as UtilFunc from 'src/app/_helpers/util.helper';
import { PrintService } from 'src/app/services/print.service';

import { SaleDetailComponent } from 'src/app/components/sale-detail/sale-detail.component';
import { EditCashComponent } from 'src/app/components/edit-cash/edit-cash.component';

const commands = {
  LF: '\x0a',
  ESC: '\x1b',
  FS: '\x1c',
  GS: '\x1d',
  US: '\x1f',
  FF: '\x0c',
  DLE: '\x10',
  DC1: '\x11',
  DC4: '\x14',
  EOT: '\x04',
  NUL: '\x00',
  EOL: '\n',
  HORIZONTAL_LINE: {
    HR_58MM: '================================',
    HR2_58MM: '********************************'
  },
  FEED_CONTROL_SEQUENCES: {
    CTL_LF: '\x0a', // Print and line feed
    CTL_FF: '\x0c', // Form feed
    CTL_CR: '\x0d', // Carriage return
    CTL_HT: '\x09', // Horizontal tab
    CTL_VT: '\x0b', // Vertical tab
  },
  LINE_SPACING: {
    LS_DEFAULT: '\x1b\x32',
    LS_SET: '\x1b\x33'
  },
  HARDWARE: {
    HW_INIT: '\x1b\x40', // Clear data in buffer and reset modes
    HW_SELECT: '\x1b\x3d\x01', // Printer select
    HW_RESET: '\x1b\x3f\x0a\x00', // Reset printer hardware
  },
  CASH_DRAWER: {
    CD_KICK_2: '\x1b\x70\x00\x32\xFA', // Sends a pulse to pin 2 []
    CD_KICK_5: '\x1b\x70\x01\x32\xFA', // Sends a pulse to pin 5 []
  },
  MARGINS: {
    BOTTOM: '\x1b\x4f', // Fix bottom size
    LEFT: '\x1b\x6c', // Fix left size
    RIGHT: '\x1b\x51', // Fix right size
  },
  PAPER: {
    PAPER_FULL_CUT: '\x1d\x56\x00', // Full cut paper
    PAPER_PART_CUT: '\x1d\x56\x01', // Partial cut paper
    PAPER_CUT_A: '\x1d\x56\x41', // Partial cut paper
    PAPER_CUT_B: '\x1d\x56\x42', // Partial cut paper
  },
  TEXT_FORMAT: {
    TXT_NORMAL: '\x1b\x21\x00', // Normal text
    TXT_2HEIGHT: '\x1b\x21\x10', // Double height text
    TXT_2WIDTH: '\x1b\x21\x20', // Double width text
    TXT_4SQUARE: '\x1b\x21\x30', // Double width & height text
    TXT_CUSTOM_SIZE: function (width, height) { // other sizes
      var widthDec = (width - 1) * 16;
      var heightDec = height - 1;
      var sizeDec = widthDec + heightDec;
      return '\x1d\x21' + String.fromCharCode(sizeDec);
    },

    TXT_HEIGHT: {
      1: '\x00',
      2: '\x01',
      3: '\x02',
      4: '\x03',
      5: '\x04',
      6: '\x05',
      7: '\x06',
      8: '\x07'
    },
    TXT_WIDTH: {
      1: '\x00',
      2: '\x10',
      3: '\x20',
      4: '\x30',
      5: '\x40',
      6: '\x50',
      7: '\x60',
      8: '\x70'
    },

    TXT_UNDERL_OFF: '\x1b\x2d\x00', // Underline font OFF
    TXT_UNDERL_ON: '\x1b\x2d\x01', // Underline font 1-dot ON
    TXT_UNDERL2_ON: '\x1b\x2d\x02', // Underline font 2-dot ON
    TXT_BOLD_OFF: '\x1b\x45\x00', // Bold font OFF
    TXT_BOLD_ON: '\x1b\x45\x01', // Bold font ON
    TXT_ITALIC_OFF: '\x1b\x35', // Italic font ON
    TXT_ITALIC_ON: '\x1b\x34', // Italic font ON
    TXT_FONT_A: '\x1b\x4d\x00', // Font type A
    TXT_FONT_B: '\x1b\x4d\x01', // Font type B
    TXT_FONT_C: '\x1b\x4d\x02', // Font type C
    TXT_ALIGN_LT: '\x1b\x61\x00', // Left justification
    TXT_ALIGN_CT: '\x1b\x61\x01', // Centering
    TXT_ALIGN_RT: '\x1b\x61\x02', // Right justification
  }
}

@Component({
  selector: 'app-sell',
  templateUrl: './sell.page.html',
  styleUrls: ['./sell.page.scss'],
  encapsulation: ViewEncapsulation.None
})
export class SellPage implements OnInit {
  title: string = 'Sell Panel';
  user: any;
  main_outlet: any;
  keyword: string = '';
  optionAutoComplete: AutoCompleteOptions;
  products: Product[] = [];
  form: FormGroup;
  isSubmitted: boolean = false;
  util = UtilFunc;
  is_mobile: boolean = true;
  label_void_item: string = 'Void Item';
  selectedProduct: CartProduct = null;
  passed_password: boolean = false;
  allow_discount: boolean = false;
  @ViewChild('searchbar') searchbar: AutoCompleteComponent;
  // added by yosri
  allow_void_sales: boolean = false;
  allow_print_label: boolean = false;

  last_sale: Cart = null;
  change: any = 0;

  printers: any[] = [];

  /// receiptPrintTemplate
  header1: String = "";
  header1Status: Boolean = false;
  header2: String = "";
  header2Status: Boolean = false;
  header3: String = "";
  header3Status: Boolean = false;
  header4: String = "";
  header4Status: Boolean = false;
  header5: String = "";
  header5Status: Boolean = false;
  policy1: String = "";
  policy1Status: Boolean = false;
  policy2: String = "";
  policy2Status: Boolean = false;
  policy3: String = "";
  policy3Status: Boolean = false;
  policy4: String = "";
  policy4Status: Boolean = false;
  policy5: String = "";
  policy5Status: Boolean = false;
  marketing1: String = "";
  marketing1Status: Boolean = false;
  marketing2: String = "";
  marketing2Status: Boolean = false;
  marketing3: String = "";
  marketing3Status: Boolean = false;
  marketing4: String = "";
  marketing4Status: Boolean = false;
  marketing5: String = "";
  marketing5Status: Boolean = false;
  ticketPolicy: String = "";
  ticketPolicyStatus: Boolean = false;
  pole1: String = "";
  pole2: String = "";

  // fast discount
  fast_discount: String = "0";

  constructor(
    private platform: Platform,
    private popoverController: PopoverController,
    private actionSheetController: ActionSheetController,
    public providerProduct: SearchProductService,
    private loading: LoadingService,
    private authService: AuthService,
    private cartService: CartService,
    private toastService: ToastService,
    private alertService: AlertService,
    private utilService: UtilService,
    private nav: NavController,
    private fb: FormBuilder,
    public payment: Payment,
    private print: PrintService,

  ) {
    this.authService.currentUser.subscribe(user => {
      this.user = user;
      if (user.role) {
        this.allow_print_label = user.role.permissions.includes('print_labels');
        this.allow_discount = user.role.permissions.includes('apply_discounts');
        this.allow_void_sales = user.role.permissions.includes('void_sales');
      }
    });
    this.utilService.get('sell/outlet', {is_main: true}).subscribe(result => {
      if(result && result.body) {
        this.main_outlet = result.body[0];
      }
    });
    this.optionAutoComplete = new AutoCompleteOptions();
    this.optionAutoComplete.autocomplete = 'on';
    this.optionAutoComplete.debounce = 750;
    this.optionAutoComplete.placeholder = 'Barcode / Name';

    this.form = this.fb.group({
      open_value: ['', [Validators.required, Validators.min(1)]],
      open_note: ['']
    })
    this.payment.load();
    this.addPrinterList();
  }

  ngOnInit() {
    this.platform.ready().then(() => {
      let width = this.platform.width();
      this.is_mobile = width <= 576;
    });
    this.getReceiptTemplate();
    this.getFastDiscount();
    this.loadLastSale();
  }

  ionViewDidEnter() {
    console.log("ionviewdidenter...");
    this.checkInitCart();
  }

  public get openClose(): Openclose {
    return this.cartService.openClose;
  }

  public get cart(): Cart {
    return this.cartService.cart;
  }

  selProduct(event) {
    if (event.product) {
      this.addToCart(event.product)
    }
    this.searchbar.clearValue();
    this.focusKeyword();
  }

  checkInitCart() {
    if (this.cartService.openClose._id) {
      if (this.cartService.new_sale) {
        let action = this.cartService.action;
        if (this.cart._id && !
          (this.cartService.new_sale.cart_mode == 'return'
            && this.cart.cart_mode == 'return'
            && this.cartService.new_sale.origin_sale_number == this.cart.origin_sale_number)) {
          let title = 'Hold up! You currently have a sale in progress',
            msg = 'You have a sale on the Sell screen that hasn’t been completed. You can choose to return to that sale to complete it, or save that sale and continue with this one.';
          this.alertService.presentAlertConfirm(title, msg, () => {
            if (this.cartService.cart.sale_status == 'new') this.cartService.cart.sale_status = 'parked';
            this.cartService.cart.save(() => {
              this.loadCartFromSale(action);
            })
          }, () => {
            this.cartService.new_sale = null;
            this.cartService.action = null;
          }, 'Save and Continue', 'Return to Sale in Progress');
        } else {
          this.loadCartFromSale(action);
        }
      }
    }
  }

  loadCartFromSale(action: string) {
    this.cartService.loadCartFromSale();
    if (action == 'return' && !this.cart.customer) {
      this.openCustomer(result => {
        this.initCart(action);
      })
    } else {
      this.initCart(action);
    }
  }

  focusKeyword() {
    this.searchbar.setFocus();
  }

  initCart(action?: string) {
    console.log("init cart...");
    this.cartService.initCart();
    if (action == 'return') {
      this.utilService.get('sale/sale', { sale_number: this.cart.origin_sale_number }).subscribe(result => {
        if (result && result.body) {
          const cart = result.body[0];
          if (cart.returned) {
            this.toastService.show('Already returned sale.');
            this.cartService.cart.init();
          } else {
            // if (!this.cart._id) this.cartService.cart.save();
            // this.cartService.cart.save();
          }
        } else {
          this.toastService.show('No existing original sale.');
          this.cartService.cart.init();
        }
      })
    } else if (action == 'void') {
      if (this.cart.voided) {
        this.toastService.show('Already voided sale.');
        this.cartService.cart.init();
      } else {
        this.cartService.cart.save();
      }
    }
  }

  addToCart(product: Product) {
    if (!this.openClose._id || this.cart.isRefund) {
      this.toastService.show('On Return Items, you can\'t add new product to cart.');
      return;
    }
    this.cartService.addToCart(product);
  }

  openAddToCart() {
    if (!this.openClose._id || this.cart.isRefund) {
      this.toastService.show('On Return Items, you can\'t add new product to cart.');
      return;
    }
    this.nav.navigateForward(['/add-to-cart']);
  }

  public get selected_cart_product(): CartProduct {
    let sel_cart_product = this.cart.getSelectedBundleProduct();
    return this.cart.getProductsFromBundle(sel_cart_product);
  }

  public get selected_cart_product_length() {
    return this.cart.getSelectedBundleProducts().length;
  }

  selCartProduct(product: CartProduct) {
    product.checked = !product.checked;
    this.deSelectOther(product);
  }

  deSelectOther(product: CartProduct) {
    if (product.checked) {
      this.cartService.cart.deSelectOtherBundleProducts(product);
      if (this.cart.isVoid) {
        this.label_void_item = product.void ? 'Cancel Void' : 'Void Item';
      }
    } else {
      this.label_void_item = 'Void Item';
    }
  }

  removeProductFromCart() {
    if (!this.selected_cart_product) return;
    let cart_products_list: CartProduct[] = [];
    cart_products_list = this.cart.getSelectedBundleProducts();
    if (this.cart.store_info.preferences.confirm_delete_product) {
      this.alertService.presentConfirmDelete('Item', () => {
        cart_products_list.forEach(element => {
          this.cartService.removeProductFromCart(this.cart.getProductsFromBundle(element));
        });
      })
    } else {
      cart_products_list.forEach(element => {
        this.cartService.removeProductFromCart(this.cart.getProductsFromBundle(element));
        // this.cartService.removeProductFromCart(this.selected_cart_product);
      });
    }
  }

  async openCustomer(callback?: Function) {
    const popover = await this.popoverController.create({
      component: ChooseCustomerComponent,
      // event: ev,
      cssClass: 'popover_custom fixed-width',
      translucent: true,
      componentProps: { c_customer: this.cart.customer }
    });

    popover.onDidDismiss().then(result => {
      let a = false;
      if (typeof result.data != 'undefined') {
        let data = result.data;
        if (data.process && data.customer) {
          this.cartService.cart.customer = data.customer;
          this.cartService.cart.save();
          a = true;
        }
      }
      if (callback) callback(a);
    });
    await popover.present();
  }

  async changePW(cart_product: CartProduct, mode: string) {
    let product = this.cart.getProductsFromBundle(cart_product);
    let data: any;
    if (product) {
      if (mode == 'price') data = { price: product.prompt_price };
      if (mode == 'weight') data = { weight: product.weight, blank_cup_weight: product.product.data.blank_cup_weight };
      if (mode == 'serial') data = { serial: product.serial };
      await this.cartService.openPW(product, data);
    }
  }

  checkButtonStatus(button: string) {
    if (!this.cartService.isOpenRegister) return false;
    switch (button) {
      case 'view_sales':
        return true;
        break;
      case 'print_current':
        if(!this.allow_print_label) return false;
        break;
      case 'print_last_tran':
        if (!this.cartService.lastClose) return false;
        break;
      case 'park_sale':
      case 'discard_sale':
        if (!this.cart.is_manage_sale || Constants.paid_status.includes(this.cart.sale_status)) return false;
        break;
      case 'quote_sale':
      case 'mark_as_unfulfilled':
        if (!this.cart.is_manage_sale || this.cart.isRefund || Constants.paid_status.includes(this.cart.sale_status)) return false
        break;
      case 'add_note':
      case 'retrieve_sale':
        return true;
        break;
      case 'add_sale_discount':
        if (this.cart.isRefund) return false;
        break;
      case 'exchange_minus':
        if (this.cart.isRefund || !this.selected_cart_product || Constants.paid_status.includes(this.cart.sale_status)
          || this.selected_cart_product.product.data.has_no_price) return false;
        break;
      case 'qty':
      case 'delete':
        if (!this.selected_cart_product || this.cart.isRefund || Constants.paid_status.includes(this.cart.sale_status)) return false;
        break;
      case 'add_discount':
        if (!this.selected_cart_product || this.cart.isRefund || Constants.paid_status.includes(this.cart.sale_status)
          || this.selected_cart_product.product.data.has_no_price) return false;
        break;
      case 'cash':
        if (this.cart.total_products == 0)
          return false;
        break;
      case 'credit':
        if (this.cart.total_products == 0)
          return false;
        break;
      case 'visa':
        if (this.cart.total_products == 0)
          return false;
        break;
      case 'master':
        if (this.cart.total_products == 0)
          return false;
        break;
      case 'debit':
        if (this.cart.total_products == 0)
          return false;
        break;
      case 'check':
        if (this.cart.total_products == 0)
          return false;
        break;
      case 'foodstamp':
        if (this.cart.total_products == 0)
          return false;
        break;
      case 'ebt_cash':
        if (this.cart.total_products == 0)
          return false;
        break;
      case 'gift':
        if (this.cart.total_products == 0)
          return false;
        break;
      case 'rewards':
        if (this.cart.total_products == 0)
          return false;
        break;
      case 'charge_account':
        if (!this.cart.able_to_pay) return false;
        break;
      case 'layby':
      case 'on_account':
        if (this.cart.isRefund || !this.cart.customer || this.cart.total_to_pay != this.cart.totalIncl
          || !this.cart.able_to_pay || Constants.paid_status.includes(this.cart.sale_status) || this.cart.sale_status == 'layby') return false;
        break;
      case 'store_credit':
        if (!this.cart.customer || (!this.cart.isRefund && this.cart.customer && this.cart.customer.data.credit <= 0) || !this.cart.able_to_pay)
          return false;
        break;
      case 'void_sale':
        if (!this.allow_void_sales || this.cart.total_products == 0 || !this.selected_cart_product) return false;
        else return true;
        break;
      case 'return_items':
        console.log("return_items: " + this.cart.sale_status);
        if (['parked', 'new'].includes(this.cart.sale_status) || this.cart.voided_payments.length > 0) return false;
        break;
      case 'void_item':
        if (['parked', 'new'].includes(this.cart.sale_status) || !this.selected_cart_product) return false;
        break;
      case 'open_drawer_quick':
        return true;
        break;
      case 'open_drawer':
        return true;
        break;
      case 'fast_discount_item':
        return true;
        break;
      case 'fast_discount_volume':
        return true;
        break;
      case 'tax_exempt':
        return true;
        break;
      default:
        return false;
    }
    return true;
  }

  async openActionSheet(mode: string) {
    const headers = {
      sales: 'Sale Actions', items: 'Item Actions', payment: 'Payment Actions', print: 'Print Actions', drawer:'Open Drawer Actions', more: 'More Button Actions'
    };
    const buttons = {
      sales: [
        { text: 'View Sales', cssClass: 'orange', action: 'view_sales' },
        { text: 'Retrieve Sale', cssClass: 'orange', action: 'retrieve_sale' },
        { text: 'Park Sale', cssClass: 'orange', action: 'park_sale' },
        { text: 'Quote Sale', cssClass: 'orange', action: 'quote_sale' },
        { text: 'Mark as Unfulfilled', cssClass: 'orange', action: 'mark_as_unfulfilled' },
        { text: 'Discard Sale', cssClass: 'danger', action: 'discard_sale' },
        { text: 'Void Sale', cssClass: 'danger', action: 'void_sale' },
        { text: 'Add Discount', cssClass: '', action: 'add_sale_discount' },
        { text: 'Add Note', cssClass: '', action: 'add_note' },
        { text: 'Cancel', icon: 'close', role: 'cancel' }
      ],
      items: [
        { text: 'Exchange Minus', cssClass: '', action: 'exchange_minus' },
        { text: 'Add Discount', cssClass: '', action: 'add_discount' },
        { text: 'Quantity', cssClass: '', action: 'qty' },
        { text: 'Delete', cssClass: 'danger', action: 'delete' },
        { text: this.label_void_item, cssClass: 'danger', action: 'void_item' },
        { text: 'Return Items', cssClass: 'danger', action: 'return_items' },
        { text: 'Cancel', icon: 'close', role: 'cancel' }
      ],
      payment: [],
      print: [
        { text: 'Print', cssClass: 'secondary', action: 'print_current' },
        { text: 'Print last transaction', cssClass: 'secondary', action: 'print_last_tran' },
        { text: 'Cancel', icon: 'close', role: 'cancel' }
      ],
      drawer: [
        { text: 'Open Drawer', cssClass: 'secondary', action: 'open_drawer' },
        { text: 'Open Drawer Quick', cssClass: 'secondary', action: 'open_drawer_quick' },
        { text: 'Cancel', icon: 'close', role: 'cancel' }
      ],
      more: [
        { text: 'Fast Discount (Item)', cssClass: 'secondary', action: 'fast_discount_item' },
        { text: 'Fast Discount (Volume)', cssClass: 'secondary', action: 'fast_discount_volume' },
        { text: 'Tax Exempt', cssClass: 'secondary', action: 'tax_exempt' },
        { text: 'Cancel', icon: 'close', role: 'cancel' }
      ]
    }

    for (let p of this.payment.payment_buttons) {
      let css = 'blue';
      if (this.isRefundButton(p.code)) css = 'danger';
      buttons.payment.push({
        text: p.label, cssClass: css, action: p.code
      })
    }
    buttons.payment.push({ text: 'Cancel', icon: 'close', role: 'cancel' });
    if (mode == 'sales') {
      if (this.cart.discount.value) {
        let button = buttons.sales.find(item => item.action == 'add_sale_discount');
        button.text = 'Change Discount';
      }
    }
    if (mode == 'items') {
      if (this.selected_cart_product && this.selected_cart_product.discount.value) {
        let button = buttons.items.find(item => item.action == 'add_discount');
        button.text = 'Change Discount';
      }
    }
    for (let b of buttons[mode]) {
      if (typeof b.action != 'undefined') {
        let action = b.action;
        let status = this.checkButtonStatus(action);
        if (!status) b.cssClass += ' disabled';
        if (mode == 'sales' || mode == 'items' || mode == 'print' || mode == 'drawer' || mode == 'more') {
          b.handler = () => {
            this.doAction(action);
          }
        } else {
          b.handler = () => {
            this.startPay(action);
          }
        }
        delete b.action;
      }
    }
    const actionSheet = await this.actionSheetController.create({
      header: headers[mode],
      cssClass: 'custom-action-sheet',
      buttons: buttons[mode]
    });

    await actionSheet.present();
  }

  doAction(action: string) {
    let status = this.checkButtonStatus(action);
    console.log(action + " doaction:" + status);
    if (!status) return false;
    switch (action) {
      case 'view_sales':
        this.nav.navigateForward(['/main/sell/sales-history']);
        break;
      case 'delete':
        this.removeProductFromCart();
        break;
      case 'add_note':
        this.openNote();
        break;
      case 'add_sale_discount':
        this.addSaleDiscount();
        break;
      case 'exchange_minus':
        this.exchangeMinus();
        break;
      case 'add_discount':
        this.addDiscount();
        break;
      case 'qty':
        this.updateQuantity();
        break;
      case 'discard_sale':
        this.discardSale();
        break;
      case 'park_sale':
        this.parkSale();
        break;
      case 'quote_sale':
        this.quoteSale();
        break;
      case 'mark_as_unfulfilled':
        this.markUnfulfilled();
        break;
      case 'retrieve_sale':
        this.nav.navigateForward(['/retrieve-sale']);
        break;
      case 'void_item':
        this.voidItem();
        break;
      case 'return_items':
        this.returnItems();
        break;
      case 'void_sale':
        this.voidSale();// added by yosri
        break;
      case 'print_current':
        this.printSale();
        break;
      case 'print_last_tran':
        this.printLastSale();
        break;
      case 'open_drawer_quick':
        this.openDrawerQuick();
        break;
      case 'open_drawer':
        this.openDrawer();
        break;
      case 'fast_discount_item':
        this.fastDiscount(false);
        break;
      case 'fast_discount_volume':
        this.fastDiscount(true);
        break;
      case 'tax_exempt':
        this.taxExempt();
        break;
    }
    return true;
  }

  async openRegister() {
    this.isSubmitted = true;
    if (this.form.valid) {
      const data = this.form.value;
      await this.loading.create();
      this.cartService.openRegister(data, async result => {
        await this.loading.dismiss();
        if (result) {
          this.toastService.show(Constants.message.successOpenRegister);
        } else {
          this.toastService.show(Constants.message.failedSave);
        }
      })
    }
  }

  async openNote(msg?: string, item?: string, callback?: Function) {
    const data = { note: this.cart.note, msg: msg, item: item };
    const popover = await this.popoverController.create({
      component: SaleNoteComponent,
      // event: ev,
      cssClass: 'popover_custom',
      translucent: true,
      componentProps: { data: data }
    });

    popover.onDidDismiss().then(result => {
      if (typeof result.data != 'undefined') {
        let data = result.data;
        if (data.process && data.note) {
          this.cartService.cart.note = data.note;
          this.cartService.cart.save();
          if (callback) callback();
        }
      }
    });
    await popover.present();
  }

  addSaleDiscount(): void {
    if (!this.allow_discount) {
      this.toastService.show(Constants.message.notAllowedDiscount);
      return;
    }
    if (!this.passed_password) {
      this.confirmPassword(() => {
        this._addDiscount(true);
      });
    } else {
      this._addDiscount(true);
    }
  }

  addDiscount(): void {
    if (!this.selected_cart_product) return;
    if (!this.allow_discount) {
      this.toastService.show(Constants.message.notAllowedDiscount);
      return;
    }
    if (this.selected_cart_product.product.data.none_discount_item) {
      this.toastService.show('This product is not discountable.');
      return;
    }
    if (!this.passed_password) {
      this.confirmPassword(() => {
        this._addDiscount(false);
      });
    } else {
      this._addDiscount(false);
    }
  }

  changeDiscountItem(product: CartProduct) {
    product.checked = true;
    this.deSelectOther(product);
    this.addDiscount();
  }

  async _addDiscount(is_global: boolean) {
    let data = { discount: this.cart.discount, is_global: is_global };
    if (!is_global) data.discount = this.selected_cart_product.discount;
    const popover = await this.popoverController.create({
      component: DiscountComponent,
      // event: ev,
      cssClass: 'popover_custom fixed-width',
      translucent: true,
      componentProps: data
    });

    popover.onDidDismiss().then(result => {
      if (typeof result.data != 'undefined') {
        let data = result.data;
        if (data.process) {
          if (is_global) {
            this.cartService.cart.discount = data.discount;
            this.cartService.cart.setGlobalDiscount();
          } else {
            let cart_products_list: CartProduct [] = [];
            cart_products_list = this.cart.getSelectedBundleProducts();
            cart_products_list.forEach(element => {
              // let product: CartProduct = this.cart.products.find(item => item == element);
              // product.discount = data.discount;
              this.cart.getProductsFromBundle(element).discount = data.discount;
              this.cartService.cart.save();
            });
          }
          this.cartService.cart.save();
        }
      }
    });
    await popover.present();
  }

  fastDiscount(is_global: boolean) {
    console.log("fast discount...");
    if (!this.selected_cart_product) {
      this.toastService.show('You must to select one or more item');
      return;
    }
    let data = { mode: 'percent', value: Number(this.fast_discount)};

    if (is_global) {  // fast discount volue
      this.cartService.cart.discount = data;
      this.cartService.cart.setGlobalDiscount();
    } else { // fast discount item
      let cart_products_list: CartProduct [] = [];
      cart_products_list = this.cart.getSelectedBundleProducts();
      cart_products_list.forEach(element => {
        this.cart.getProductsFromBundle(element).discount = data;
        this.cartService.cart.save();
      });
    }
  }

  async confirmPassword(callback?: Function) {
    const popover = await this.popoverController.create({
      component: ConfirmPasswordComponent,
      // event: ev,
      cssClass: 'popover_custom fixed-width',
      translucent: true,
      componentProps: { private_web_address: this.user.private_web_address, email: this.user.email }
    });

    popover.onDidDismiss().then(result => {
      if (typeof result.data != 'undefined') {
        let data = result.data;
        if (data.process) {
          this.passed_password = true;
          if (callback) callback();
        }
      }
    });
    await popover.present();
  }

  exchangeMinus() {
    if (!this.selected_cart_product) return;
    if (this.selected_cart_product_length > 1) {
      let cart_products_list: CartProduct [] = [];
      cart_products_list = this.cart.getSelectedBundleProducts();
      cart_products_list.forEach(element => {
        this.cart.getProductsFromBundle(element).sign *= -1;
        this.cartService.cart.save();
      });
    } else {
      this.selected_cart_product.sign *= -1;
      this.cartService.cart.save();
    }
  }

  async updateQuantity() {
    if (!this.selected_cart_product) return;
    const popover = await this.popoverController.create({
      component: QuantityComponent,
      // event: ev,
      cssClass: 'popover_custom fixed-width',
      translucent: true,
      componentProps: { quantity: this.selected_cart_product.qty }
    });

    popover.onDidDismiss().then(result => {
      if (typeof result.data != 'undefined') {
        let data = result.data;
        if (data.process) {
          if (this.selected_cart_product_length > 1) {
            let cart_products_list: CartProduct [] = [];
            cart_products_list = this.cart.getSelectedBundleProducts();
            cart_products_list.forEach(element => {
              this.cart.getProductsFromBundle(element).qty = data.qty;
              this.cartService.cart.save();
            });

          } else {
            this.selected_cart_product.qty = data.qty;
            this.cartService.cart.save();
          }
        }
      }
    });
    await popover.present();
  }

  discardSale() {
    console.log('discard sale...');
    if (this.cart.products.length == 0 && !this.cart._id) {
      return;
    }
    if (this.cart.store_info.preferences.confirm_discard_sale) {
      this.alertService.presentAlertConfirm('Confirm discard sale', 'Are you sure to want to discard this sale?', () => {
        this.cartService.cart.deleteSale(() => {
          this.cartService.newCart();
        })
      })
    } else {
      this.cartService.cart.deleteSale(() => {
        this.cartService.newCart();
      })
    }
  }

  parkSale() {
    this.openNote(Constants.message.sale_note.park, 'Park', () => {
      this.cartService.cart.sale_status = 'parked';
      this.cartService.cart.save(() => {
        this.toastService.show(Constants.message.sale.parked);
        this.cartService.cart.delete(() => {
          this.cartService.newCart();
        })
      });
    })
  }

  quoteSale() {
    this.openNote(Constants.message.sale_note.quote, 'Quote', () => {
      this.cartService.cart.sale_status = 'quoted';
      this.cartService.cart.save(() => {
        this.toastService.show(Constants.message.sale.quote);
        this.cartService.cart.delete(() => {
          this.cartService.newCart();
        })
      });
    })
  }

  async markUnfulfilled() {
    const popover = await this.popoverController.create({
      component: UnfulfilledSaleComponent,
      // event: ev,
      cssClass: 'popover_custom fixed-width',
      translucent: true,
      componentProps: { note: this.cart.note }
    });

    popover.onDidDismiss().then(result => {
      if (typeof result.data != 'undefined') {
        let data = result.data;
        if (data.process) {
          let mode = data.fulfillment.mode, status = mode + '_unfulfilled';
          this.cartService.cart.sale_status = status;
          this.cartService.cart.fulfillment = data.fulfillment;
          this.cartService.cart.save(() => {
            this.toastService.show(Constants.message.sale[status]);
            this.cartService.cart.delete(() => {
              this.cartService.newCart();
            })
          });
        }
      }
    });
    await popover.present();
  }

  isRefundButton(code: string) {
    return (!['layby', 'store_credit', 'on_account'].includes(code)) && (this.cart.isRefund || this.cart.cart_mode == 'void');
  }

  async startPay(pay_mode: string) {
    if (pay_mode == 'cash' && !this.cart.isRefund && !this.cart.isVoid) {
      const popover = await this.popoverController.create({
        component: PayAmountComponent,
        // event: ev,
        cssClass: 'popover_custom fixed-width',
        translucent: true,
        componentProps: { total_amount_to_pay: this.cart.total_to_pay }
      });

      popover.onDidDismiss().then(result => {
        if (typeof result.data != 'undefined') {
          let data = result.data;
          if (data.process) {
            if (this.cart.isRefund && data.amount < 0 || !this.cart.isRefund && data.amount > 0) {
              const pay_amount = data.amount>=this.cart.total_to_pay?this.cart.total_to_pay:data.amount;
              this.cart._change = data.amount - this.cart.total_to_pay > 0 ? data.amount - this.cart.total_to_pay : 0;
              this.pay(pay_mode, pay_amount);
            }
          }
        }
      });
      await popover.present();
    } else {
      this.pay(pay_mode, this.cart.total_to_pay);
    }
  }

  pay(pay_mode: string, pay_amount: number): void {
    if (this.cart.isRefund) {
      this.refund(pay_mode, pay_amount);
      return;
    }
    if (this.cart.isVoid) {
      this.voidItems(pay_mode);
      return;
    }
    if (pay_amount <= 0) {
      return;
    }
    this.cartService.checkProductsInventory(() => {
      if (this.cart.products.length == 0) {
        this.toastService.show(Constants.message.invalidCartProducts);
      } else {
        if (!['cash', 'store_credit'].includes(pay_mode)) {
          // if(this.cart.store_info.preferences.confirm_pay) {
          //   this.confirmPay(pay_mode, () => {
          //     this._pay(pay_mode, pay_amount);
          //   })
          // } else {
          this._pay(pay_mode, pay_amount);
          // }
        } else if (pay_mode == 'store_credit') {
          if (this.cart.customer.data.credit < pay_amount) {
            let title = 'Pay ' + this.cart.customer.credit_str + ' with Store Credit';
            let msg = 'You can only redeem up to the value of your current store credit balance. You may still continue with this as a partial payment, then choose another payment method for the remaining balance.';
            this.alertService.presentAlertConfirm(title, msg, () => {
              pay_amount = this.cart.customer.data.credit;
              this._pay(pay_mode, pay_amount);
            }, null, 'Make partial payment', 'Choose a different payment type');
          } else {
            this._pay(pay_mode, pay_amount);
          }
        } else {
          this._pay(pay_mode, pay_amount);
        }
      }
    })
  }

  refund(pay_mode: string, pay_amount: number): void {
    if (pay_amount >= 0) {
      return;
    }
    this._pay(pay_mode, pay_amount);
  }

  voidItems(pay_mode: string) {
    let pay_amount = this.cart.voided_amount;
    if (pay_amount > 0) {
      this._pay(pay_mode, pay_amount);
    }
  }

  private _pay(pay_mode: string, pay_amount: number) {
    console.log("[LOG] pay mode: " + pay_mode + ", pay_amount: " + pay_amount);
    this.cart.pay(pay_mode, pay_amount);
    this.cartService.processCustomerBalance(pay_mode, pay_amount);
    if (this.cart.able_to_complete) {
      if (!['layby'].includes(pay_mode)) {
        if (!this.cart.isVoid) {
          for (let product of this.cart.products) {
            product.updateInventory();
          }
        } else {
          for (let p of this.cart.products) {
            if (p.void) {
              let pp = new CartProduct(p.product, p.variant_id);
              pp.loadDetails(p);
              pp.qty *= -1;
              pp.updateInventory();
            }
          }
        }
      }
      this.completeSale();
    } else {
      this.cartService.cart.save();
    }
  }

  printSale() {
    console.log("printsale...");
    const printMac = this.printers[0]?.id;

    const date = new Date(Date.now())
    const dateNow = date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate() + " " + date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds();
    let receipt = "";
    receipt += commands.CASH_DRAWER.CD_KICK_2;

    receipt += commands.HARDWARE.HW_INIT;
    receipt += commands.TEXT_FORMAT.TXT_ALIGN_CT;
    receipt += this.pole1;
    receipt += commands.EOL;
    receipt += this.pole2;
    receipt += commands.EOL;
    receipt += commands.EOL;
    receipt += commands.TEXT_FORMAT.TXT_2WIDTH;
    receipt += commands.TEXT_FORMAT.TXT_ALIGN_CT;
    receipt += this.header1;
    receipt += commands.EOL;
    receipt += this.header2;
    receipt += commands.EOL;
    receipt += commands.TEXT_FORMAT.TXT_NORMAL;
    receipt += commands.TEXT_FORMAT.TXT_ALIGN_CT;
    receipt += this.header3;
    receipt += commands.EOL;
    receipt += this.header4;
    receipt += commands.EOL;
    receipt += this.header5;
    receipt += commands.EOL;
    receipt += commands.EOL;
    receipt += commands.TEXT_FORMAT.TXT_4SQUARE;
    receipt += commands.TEXT_FORMAT.TXT_ALIGN_CT;
    receipt += this.cartService.cart.store_info.store_name;
    receipt += commands.EOL;
    receipt += commands.EOL;
    receipt += commands.TEXT_FORMAT.TXT_NORMAL;
    receipt += this.cartService.cart.store_info.physical_address.country.country_name + " " + this.cartService.cart.store_info.physical_address.city + " " + this.cartService.cart.store_info.physical_address.street;
    receipt += commands.EOL;
    receipt += commands.EOL;
    receipt += this.cartService.cart.store_info.phone;
    receipt += commands.EOL;
    receipt += commands.EOL;
    receipt += commands.TEXT_FORMAT.TXT_ALIGN_CT;
    receipt += "Receipt ";
    receipt += this.cartService.cart.sale_number;
    receipt += commands.EOL;
    receipt += commands.TEXT_FORMAT.TXT_NORMAL;
    receipt += commands.TEXT_FORMAT.TXT_ALIGN_CT;
    receipt += commands.EOL;
    receipt += dateNow;
    receipt += commands.EOL;
    receipt += commands.EOL;
    receipt += commands.TEXT_FORMAT.TXT_NORMAL;
    receipt += commands.HORIZONTAL_LINE.HR_58MM;
    receipt += commands.EOL;
    receipt += commands.TEXT_FORMAT.TXT_ALIGN_LT;
    this.cartService.cart.products.forEach((p) => {
      receipt += commands.EOL;
      receipt += commands.TEXT_FORMAT.TXT_NORMAL;
      receipt += commands.TEXT_FORMAT.TXT_ALIGN_LT;
      receipt += p.product_name;
      receipt += commands.EOL;
      receipt += commands.TEXT_FORMAT.TXT_ALIGN_LT;
      receipt += `${p.qty}     `;
      receipt += commands.TEXT_FORMAT.TXT_ALIGN_RT;
      receipt += p.discountedTotalWithoutGlobal_str;

    })
    receipt += commands.EOL;
    receipt += commands.HORIZONTAL_LINE.HR2_58MM;
    receipt += commands.EOL;
    receipt += commands.TEXT_FORMAT.TXT_ALIGN_LT;
    receipt += "Subtotal     ";
    receipt += commands.TEXT_FORMAT.TXT_ALIGN_RT;
    receipt += this.cartService.cart.subTotal_str;
    receipt += commands.EOL;
    receipt += commands.TEXT_FORMAT.TXT_ALIGN_LT;
    receipt += `Discount${this.cartService.cart.discount_rate}     `;
    receipt += commands.TEXT_FORMAT.TXT_ALIGN_RT;
    receipt += this.cartService.cart.discount_str;
    receipt += commands.EOL;
    receipt += commands.TEXT_FORMAT.TXT_ALIGN_LT;
    receipt += `Total Tax${this.cartService.cart.taxRate_str}     `;
    receipt += commands.TEXT_FORMAT.TXT_ALIGN_RT;
    receipt += this.cartService.cart.taxAmount_str;
    receipt += commands.EOL;
    receipt += commands.EOL;
    receipt += commands.TEXT_FORMAT.TXT_ALIGN_LT;
    receipt += "Sale Total     ";
    receipt += commands.TEXT_FORMAT.TXT_ALIGN_RT;
    receipt += this.cartService.cart.totalIncl_str;
    // receipt += commands.EOL;
    // receipt += commands.TEXT_FORMAT.TXT_ALIGN_LT;
    // receipt += "Voided     ";
    // receipt += commands.TEXT_FORMAT.TXT_ALIGN_RT;
    // receipt += this.cartService.cart.voidedAmount_str;
    receipt += commands.EOL;
    receipt += commands.TEXT_FORMAT.TXT_ALIGN_LT;
    receipt += "Change     ";
    receipt += commands.TEXT_FORMAT.TXT_ALIGN_RT;
    receipt += UtilFunc.getPriceWithCurrency(this.cartService.cart.change);
    receipt += commands.EOL;
    receipt += commands.TEXT_FORMAT.TXT_ALIGN_LT;
    receipt += "Balance     ";
    receipt += commands.TEXT_FORMAT.TXT_ALIGN_RT;
    receipt += UtilFunc.getPriceWithCurrency(this.cartService.cart.total_to_pay);
    receipt += commands.EOL;
    receipt += commands.EOL;

    if (this.policy1Status && this.policy1) {
      receipt += commands.TEXT_FORMAT.TXT_ALIGN_CT;
      receipt += this.policy1;
      receipt += commands.EOL;
    }
    if (this.policy2Status && this.policy2) {
      receipt += commands.TEXT_FORMAT.TXT_ALIGN_CT;
      receipt += this.policy2;
      receipt += commands.EOL;
    }
    if (this.policy3Status && this.policy3) {
      receipt += commands.TEXT_FORMAT.TXT_ALIGN_CT;
      receipt += this.policy3;
      receipt += commands.EOL;
    }
    if (this.policy4Status && this.policy4) {
      receipt += commands.TEXT_FORMAT.TXT_ALIGN_CT;
      receipt += this.policy4;
      receipt += commands.EOL;
    }
    if (this.policy5Status && this.policy5) {
      receipt += commands.TEXT_FORMAT.TXT_ALIGN_CT;
      receipt += this.policy5;
      receipt += commands.EOL;
    }
    receipt += commands.EOL;
    receipt += commands.EOL;
    if (this.ticketPolicyStatus) {
      receipt += commands.TEXT_FORMAT.TXT_ALIGN_CT;
      receipt += this.ticketPolicy;
      receipt += commands.EOL;
    }
    receipt += commands.EOL;
    receipt += commands.EOL;
    if (this.marketing1Status) {
      receipt += commands.TEXT_FORMAT.TXT_ALIGN_CT;
      receipt += this.marketing1;
      receipt += commands.EOL;
    }
    if (this.marketing2Status) {
      receipt += commands.TEXT_FORMAT.TXT_ALIGN_CT;
      receipt += this.marketing2;
      receipt += commands.EOL;
    }
    if (this.marketing3Status) {
      receipt += commands.TEXT_FORMAT.TXT_ALIGN_CT;
      receipt += this.marketing3;
      receipt += commands.EOL;
    }
    if (this.marketing4Status) {
      receipt += commands.TEXT_FORMAT.TXT_ALIGN_CT;
      receipt += this.marketing4;
      receipt += commands.EOL;
    }
    if (this.marketing5Status) {
      receipt += commands.TEXT_FORMAT.TXT_ALIGN_CT;
      receipt += this.marketing5;
      receipt += commands.EOL;
    }
    receipt += commands.EOL;
    receipt += commands.TEXT_FORMAT.TXT_ALIGN_LT;

    console.log(receipt);
    this.print.sendToBluetoothPrinter(printMac, receipt);

  }

  printLastSale() {
    console.log("printlastsale...");
    const printMac = this.printers[0]?.id;

    const date = new Date(Date.now())
    const dateNow = date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate() + " " + date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds();
    let receipt = "";
    receipt += commands.CASH_DRAWER.CD_KICK_2;

    receipt += commands.HARDWARE.HW_INIT;
    receipt += commands.TEXT_FORMAT.TXT_ALIGN_CT;
    receipt += this.pole1;
    receipt += commands.EOL;
    receipt += this.pole2;
    receipt += commands.EOL;
    receipt += commands.EOL;
    receipt += commands.TEXT_FORMAT.TXT_2WIDTH;
    receipt += commands.TEXT_FORMAT.TXT_ALIGN_CT;
    receipt += this.header1;
    receipt += commands.EOL;
    receipt += this.header2;
    receipt += commands.EOL;
    receipt += commands.TEXT_FORMAT.TXT_NORMAL;
    receipt += commands.TEXT_FORMAT.TXT_ALIGN_CT;
    receipt += this.header3;
    receipt += commands.EOL;
    receipt += this.header4;
    receipt += commands.EOL;
    receipt += this.header5;
    receipt += commands.EOL;
    receipt += commands.EOL;
    receipt += commands.TEXT_FORMAT.TXT_4SQUARE;
    receipt += commands.TEXT_FORMAT.TXT_ALIGN_CT;
    receipt += this.last_sale.store_info.store_name;
    receipt += commands.EOL;
    receipt += commands.EOL;
    receipt += commands.TEXT_FORMAT.TXT_NORMAL;
    receipt += this.last_sale.store_info.physical_address.country.country_name + " " + this.last_sale.store_info.physical_address.city + " " + this.last_sale.store_info.physical_address.street;
    receipt += commands.EOL;
    receipt += commands.EOL;
    receipt += this.last_sale.store_info.phone;
    receipt += commands.EOL;
    receipt += commands.EOL;
    receipt += commands.TEXT_FORMAT.TXT_ALIGN_CT;
    receipt += "Receipt ";
    receipt += this.last_sale.sale_number;
    receipt += commands.EOL;
    receipt += commands.TEXT_FORMAT.TXT_NORMAL;
    receipt += commands.TEXT_FORMAT.TXT_ALIGN_CT;
    receipt += commands.EOL;
    receipt += dateNow;
    receipt += commands.EOL;
    receipt += commands.EOL;
    receipt += commands.TEXT_FORMAT.TXT_NORMAL;
    receipt += commands.HORIZONTAL_LINE.HR_58MM;
    receipt += commands.EOL;
    receipt += commands.TEXT_FORMAT.TXT_ALIGN_LT;
    this.last_sale.products.forEach((p) => {
      receipt += commands.EOL;
      receipt += commands.TEXT_FORMAT.TXT_NORMAL;
      receipt += commands.TEXT_FORMAT.TXT_ALIGN_LT;
      receipt += p.product_name;
      receipt += commands.EOL;
      receipt += commands.TEXT_FORMAT.TXT_ALIGN_LT;
      receipt += `${p.qty}     `;
      receipt += commands.TEXT_FORMAT.TXT_ALIGN_RT;
      receipt += p.discountedTotalWithoutGlobal_str;

    })
    receipt += commands.EOL;
    receipt += commands.HORIZONTAL_LINE.HR2_58MM;
    receipt += commands.EOL;
    receipt += commands.TEXT_FORMAT.TXT_ALIGN_LT;
    receipt += "Subtotal     ";
    receipt += commands.TEXT_FORMAT.TXT_ALIGN_RT;
    receipt += this.last_sale.subTotal_str;
    receipt += commands.EOL;
    receipt += commands.TEXT_FORMAT.TXT_ALIGN_LT;
    receipt += `Discount${this.last_sale.discount_rate}     `;
    receipt += commands.TEXT_FORMAT.TXT_ALIGN_RT;
    receipt += this.last_sale.discount_str;
    receipt += commands.EOL;
    receipt += commands.TEXT_FORMAT.TXT_ALIGN_LT;
    receipt += `Total Tax${this.last_sale.taxRate_str}     `;
    receipt += commands.TEXT_FORMAT.TXT_ALIGN_RT;
    receipt += this.last_sale.taxAmount_str;
    receipt += commands.EOL;
    receipt += commands.EOL;
    receipt += commands.TEXT_FORMAT.TXT_ALIGN_LT;
    receipt += "Sale Total     ";
    receipt += commands.TEXT_FORMAT.TXT_ALIGN_RT;
    receipt += this.last_sale.totalIncl_str;
    // receipt += commands.EOL;
    // receipt += commands.TEXT_FORMAT.TXT_ALIGN_LT;
    // receipt += "Voided     ";
    // receipt += commands.TEXT_FORMAT.TXT_ALIGN_RT;
    // receipt += this.cartService.cart.voidedAmount_str;
    receipt += commands.EOL;
    receipt += commands.TEXT_FORMAT.TXT_ALIGN_LT;
    receipt += "Change     ";
    receipt += commands.TEXT_FORMAT.TXT_ALIGN_RT;
    receipt += UtilFunc.getPriceWithCurrency(this.last_sale.change);
    receipt += commands.EOL;
    receipt += commands.TEXT_FORMAT.TXT_ALIGN_LT;
    receipt += "Balance     ";
    receipt += commands.TEXT_FORMAT.TXT_ALIGN_RT;
    receipt += UtilFunc.getPriceWithCurrency(this.last_sale.total_to_pay);
    receipt += commands.EOL;
    receipt += commands.EOL;

    if (this.policy1Status && this.policy1) {
      receipt += commands.TEXT_FORMAT.TXT_ALIGN_CT;
      receipt += this.policy1;
      receipt += commands.EOL;
    }
    if (this.policy2Status && this.policy2) {
      receipt += commands.TEXT_FORMAT.TXT_ALIGN_CT;
      receipt += this.policy2;
      receipt += commands.EOL;
    }
    if (this.policy3Status && this.policy3) {
      receipt += commands.TEXT_FORMAT.TXT_ALIGN_CT;
      receipt += this.policy3;
      receipt += commands.EOL;
    }
    if (this.policy4Status && this.policy4) {
      receipt += commands.TEXT_FORMAT.TXT_ALIGN_CT;
      receipt += this.policy4;
      receipt += commands.EOL;
    }
    if (this.policy5Status && this.policy5) {
      receipt += commands.TEXT_FORMAT.TXT_ALIGN_CT;
      receipt += this.policy5;
      receipt += commands.EOL;
    }
    receipt += commands.EOL;
    receipt += commands.EOL;
    if (this.ticketPolicyStatus) {
      receipt += commands.TEXT_FORMAT.TXT_ALIGN_CT;
      receipt += this.ticketPolicy;
      receipt += commands.EOL;
    }
    receipt += commands.EOL;
    receipt += commands.EOL;
    if (this.marketing1Status) {
      receipt += commands.TEXT_FORMAT.TXT_ALIGN_CT;
      receipt += this.marketing1;
      receipt += commands.EOL;
    }
    if (this.marketing2Status) {
      receipt += commands.TEXT_FORMAT.TXT_ALIGN_CT;
      receipt += this.marketing2;
      receipt += commands.EOL;
    }
    if (this.marketing3Status) {
      receipt += commands.TEXT_FORMAT.TXT_ALIGN_CT;
      receipt += this.marketing3;
      receipt += commands.EOL;
    }
    if (this.marketing4Status) {
      receipt += commands.TEXT_FORMAT.TXT_ALIGN_CT;
      receipt += this.marketing4;
      receipt += commands.EOL;
    }
    if (this.marketing5Status) {
      receipt += commands.TEXT_FORMAT.TXT_ALIGN_CT;
      receipt += this.marketing5;
      receipt += commands.EOL;
    }
    receipt += commands.EOL;
    receipt += commands.TEXT_FORMAT.TXT_ALIGN_LT;

    console.log(receipt);
    this.print.sendToBluetoothPrinter(printMac, receipt);

  }

  completeSale() {
    this.cartService.completeSale(async () => {
      this.toastService.show(Constants.message.successComplete);
      this.printSale();
      this.loadLastSale();
      if (this.cart.payment_status == 'cash') {
        const popover = await this.popoverController.create({
          component: PayChangeComponent,
          // event: ev,
          cssClass: 'popover_custom fixed-width',
          translucent: true,
          componentProps: { change: UtilFunc.getPriceWithCurrency(this.cart.change) }
          // componentProps: { change: UtilFunc.getPriceWithCurrency(this.change) }
        });

        popover.onDidDismiss().then(result => {
          this.cartService.newCart();
        });
        await popover.present();
      } else {
        this.cartService.newCart();
      }
    })
  }

  voidItem() {
    if (!this.selected_cart_product) return;
    this.selected_cart_product.void = !this.selected_cart_product.void;
    this.label_void_item = this.selected_cart_product.void ? 'Cancel Void' : 'Void Item';
    // added by yosri at 05/26/2022
    // this.printSale();
  }

  returnItems() {
    console.log('return items...');
    this.cartService.loadCart(this.cart._id, 'return', () => {
      this.checkInitCart();
      // this.printSale();
    })
  }

  get floatInput(): any { return this.form.get('open_value'); }
  get floatInputError(): string | void {
    if (this.floatInput.hasError('required')) { return Constants.message.requiredField; }
    if (this.floatInput.hasError('min')) { return Constants.message.invalidMinValue.replace('?', Constants.open_value.min.toString()); }
  }

  getReceiptTemplate(): void {
    this.utilService.get('sell/receipttemplate', { private_web_address: this.cartService.cart.store_info.store_name }).subscribe(result => {
      if (result && result.body) {
        this.header1 = result.body.header1;
        this.header1Status = result.body.header1Status;
        this.header2 = result.body.header2;
        this.header2Status = result.body.header2Status;
        this.header3 = result.body.header3;
        this.header3Status = result.body.header3Status;
        this.header4 = result.body.header4;
        this.header4Status = result.body.header4Status;
        this.header5 = result.body.header5;
        this.header5Status = result.body.header5Status;
        this.policy1 = result.body.policy1;
        this.policy1Status = result.body.policy1Status;
        this.policy2 = result.body.policy2;
        this.policy2Status = result.body.policy2Status;
        this.policy3 = result.body.policy3;
        this.policy3Status = result.body.policy3Status;
        this.policy4 = result.body.policy4;
        this.policy4Status = result.body.policy4Status;
        this.policy5 = result.body.policy5;
        this.policy5Status = result.body.policy5Status;
        this.marketing1 = result.body.marketing1;
        this.marketing1Status = result.body.marketing1Status;
        this.marketing2 = result.body.marketing2;
        this.marketing2Status = result.body.marketing2Status;
        this.marketing3 = result.body.marketing3;
        this.marketing3Status = result.body.marketing3Status;
        this.marketing4 = result.body.marketing4;
        this.marketing4Status = result.body.marketing4Status;
        this.marketing5 = result.body.marketing5;
        this.marketing5Status = result.body.marketing5Status;
        this.ticketPolicy = result.body.ticketPolicy;
        this.ticketPolicyStatus = result.body.ticketPolicyStatus;
        this.pole1 = result.body.pole1;
        this.pole2 = result.body.pole2;
      }
    });
  }

  addPrinterList(): void {
    this.print.searchBluetoothPrinter()
      .then( resp => {
        this.printers = resp;
      })
  }

  voidSale() {
    console.log("sell/voidsale...");
    let title = 'You are about to void this sale.';
    let msg = 'This will return the products back into your inventory and remove any payments that were recorded. You’ll still be able to see the details of this sale once it has been voided. This can’t be undone.';
    this.alertService.presentAlertConfirm(
      title,
      msg,
      () => {
        this.cart.voidSale(() => {
          this.toastService.show(Constants.message.successVoided);
          this.cartService.newCart();
        })
      },
      null,
      'Void Sale',
      'Don\'t Void'
    );
  }

  loadLastSale(callback?: Function) {
    console.log("loadlastsale...");
    const filter = {range: 'last_sale', user_id: this.user._id};
    this.utilService.get('sale/sale', filter).subscribe(result => {
      if(result && result.body.data.length==1) {
        this.last_sale = new Cart(this.authService, this.utilService);
        this.last_sale.loadByCart(result.body.data[0]);
        // if(callback) callback();
      } else {
        this.last_sale = null;
      }
    })
  }

  openDrawerQuick() {
    const printMac = this.printers[0]?.id;
    let data = "";
    let code1 = "27 112 0 150 250"; //decimal
    let code2 = commands.CASH_DRAWER.CD_KICK_2;
    let code = "ESCp0û."; //ascii
    this.print.sendToBluetoothPrinter(printMac, code2);
  }

  async openDrawerNote(msg?: string, item?: string, callback?: Function) {
    const data = { note: "", msg: "", item: "" };
    const popover = await this.popoverController.create({
      component: DrawerNoteComponent,
      // event: ev,
      cssClass: 'popover_custom fixed-width',
      translucent: true,
      componentProps: { data: data }
    });

    popover.onDidDismiss().then(result => {
      if (typeof result.data != 'undefined') {
        let data = result.data;
        if (data.process && data.reason && data.amount) {

          data.user_id = this.user._id;
          data.private_web_address = this.user.private_web_address;

          this.utilService.post('cash/history', data).subscribe(result => {
            this.openDrawerQuick();
          })
        }
      }
    });
    await popover.present();
  }

  openDrawer() {
    this.confirmPassword(() => {
      this.openEditCash();
    });
  }

  async openEditCash() {
    let cash = {
      _id: '',
      reasons: '',
      transaction: 1,
      is_credit: '1'
    };
    const popover = await this.popoverController.create({
      component: EditCashComponent,
      // event: ev,
      cssClass: 'popover_custom fixed-width',
      translucent: true,
      componentProps: {cash: cash, user: this.user, main_outlet: this.main_outlet}
    });

    popover.onDidDismiss().then(result => {
      if(typeof result.data != 'undefined') {
        let data = result.data;
        console.log("openeditcash result...");
        this.openDrawerQuick();
      }
    });
    await popover.present();
  }

  getFastDiscount() {
    this.utilService.get("discount/fast_discount").subscribe(result => {
      const data= result.body.data;
      if(data) {
        this.fast_discount = data.discount_percent;
      }
    });
  }

  taxExempt() {
    console.log("tax exempt...");
    this.cart.is_ignoreTax = true;
    this.cart.save();
  }

}
