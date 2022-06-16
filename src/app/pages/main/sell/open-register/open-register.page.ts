import { Component, OnInit }                  from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NavController, PopoverController, Platform } from '@ionic/angular';

import * as UtilFunc      from 'src/app/_helpers/util.helper';
import { Openclose }        from 'src/app/_classes/openclose.class';
import { StorePolicy }      from 'src/app/_classes/store_policy.class';
import { Constants, Commands } from 'src/app/_configs/constants';
import { AuthService }    from 'src/app/_services/auth.service';
import { LoadingService } from 'src/app/_services/loading.service';
import { ToastService }   from 'src/app/_services/toast.service';
import { UtilService }    from 'src/app/_services/util.service';
import { AlertService } from 'src/app/_services/alert.service';
import { CartService } from 'src/app/_services/cart.service';
import { PrintService }   from 'src/app/services/print.service';
import { CashDetailComponent } from 'src/app/components/cash-detail/cash-detail.component';
// import { BackgroundModeOriginal } from '@ionic-native/background-mode';
import { BackgroundMode } from '@awesome-cordova-plugins/background-mode/ngx';


@Component({
  selector: 'app-open-register',
  templateUrl: './open-register.page.html',
  styleUrls: ['./open-register.page.scss'],
})
export class OpenRegisterPage implements OnInit {
  title = {open: 'Open Register', close: 'Close Register'};
  user: any;
  util = UtilFunc;
  form: FormGroup;
  isSubmitted: boolean = false;

  categoryTypeList = [];
  categories = [];
  allData:any = [];
  reportDatabyCategories = [];

  all_columns:any[] = [
    {prop: 'name', name: 'Category Name', sortable: true, checked: true},
    {prop: 'sale_qty', name: 'SaleQty', sortable: true, checked: true},
    {prop: 'sale_sum', name: 'SaleSum', sortable: true, checked: true}
  ];
  show_columns:any[] = [1, 2, 3];
  tableloading: boolean = false;

  printers: any[] = [];

  // store policy setting
  batchReportStatus: boolean = false;
  paymentSummaryStatus: boolean = false;
  emailInventoryStatus: boolean = false;

  constructor(
    private authService: AuthService,
    private utilService: UtilService,
    private loading: LoadingService,
    private toastService: ToastService,
    private nav: NavController,
    private popoverController: PopoverController,
    private alertService: AlertService,
    private cartService: CartService,
    private fb: FormBuilder,
    // public openClose: Openclose,
    // public lastClose: Openclose,
    private print: PrintService,
    public store_policy:StorePolicy,
    private backgroundMode: BackgroundMode,
    private plt: Platform,
  ) {
    this.authService.checkPremission('close_register');
    this.form = this.fb.group({
      open_value: ['', [Validators.required, Validators.min(1)]],
      open_note: ['']
    });
    this.addPrinterList();
    
  }

  ngOnInit() {
    this.getCategoryTypeList();
    this.getStorePolicy();
    if('close'.includes(this.mode)) {
      this.cartService.getOpenClose();
    } else {
      this.cartService.getLastClose();
    }
    this.initTable();
    this.initBackgroundMode();
  }

  ionViewDidEnter() {
    this.getReportbyCategories();
  }

  private initBackgroundMode() {
    this.plt.ready().then(()=>{
      console.log("step 1");
      this.backgroundMode.enable();
      console.log("step 2");
      const title = "Background mode testing";
      const msg = "This is background mode";
      setInterval(() => {
        this.alertService.presentAlertConfirm(title, msg, () => {
          this.toastService.show("Hello");
        });
      }, 5000);
      this.backgroundMode.on('activate').subscribe((s)=>{
        console.log('backgroundMode activate');
        if(this.plt.is("android")) {
          
        }
      });
    });
  }

  public get mode():string {
    if(this.cartService.openClose._id) {
      return 'close';
    } else {
      return 'open';
    }
  }

  addPrinterList(): void {
    this.print.searchBluetoothPrinter()
      .then( resp => {
        this.printers = resp;
      })
  }

  public get openClose():Openclose {
    return this.cartService.openClose;
  }

  public get lastClose():Openclose {
    return this.cartService.lastClose;
  }

  async save(){
    this.isSubmitted = true;
    if(this.form.valid){
      const data = this.form.value;
      await this.loading.create();
      this.cartService.openRegister(data, async result => {
        await this.loading.dismiss();
        if(result){
          this.toastService.show(Constants.message.successOpenRegister);
        } else {
          this.toastService.show(Constants.message.failedSave);
        }
      })
    }
  }

  async openCashDetail(openClose: Openclose) {
    const popover = await this.popoverController.create({
      component: CashDetailComponent,
      // event: ev,
      cssClass: 'popover_custom',
      translucent: true,
      componentProps: {openClose: openClose}
    });

    await popover.present();
  }

  closeRegister(){
    
    let title = 'Close Register';
    let msg = 'Are you sure to want to close this register?';
    this.alertService.presentAlertConfirm(title, msg, () => {
      this.cartService.closeRegister(() => {
        this.toastService.show('Register Closed successfully.');
      })
    });
    // this.getReportbyCategories();
    if (!this.batchReportStatus){
      this.printReport();
    }
    if(this.emailInventoryStatus) {
      // this.emailToCustomer();
    }
  }

  getReportbyCategories() {
    
    this.tableloading = true;

    let filter = {      
      start: this.openClose.opening_time,
      user_id: this.openClose.user._id,
      end: '',
    }

    if(filter.start == '') {
      this.tableloading = false;
      return;
    }
    
    // const filter = {user_id: this.openClose.user_id._id, start: this.openClose.opening_time, end: };
    this.utilService.get('sale/sale', filter).subscribe(result => {
      const data = result.body;
      if (result && result.body) {
        this.allData = [];
        for(let s of result.body) {
          for(let p of s.products) {
            let index = this.categories.findIndex(item=>item == p.product_id.type);
            if (index == -1) this.categories.push(p.product_id.type);
            this.allData.push(p);
          }
        }
        this.getReportDatabyCategories();
      }
      
    })
  }

  getReportDatabyCategories() {
    this.reportDatabyCategories = [];
    for(let c of this.categories) {
      let cData = this.allData.filter(item => item.product_id.type == c);
      console.log(cData);
      let totalQty = cData.reduce((a, b)=>a + b.qty, 0);
      let price = cData[0].price;
      let totalPrice = totalQty * price;
      let catname = this.categoryTypeList.filter(item => item._id == c);
      let name = "";
      if(catname) {
        name = catname[0].name;
      }
      let data = {
        name: name,
        sale_qty: totalQty,
        sale_sum:this.util.getPriceWithCurrency(totalPrice)
      };
      this.reportDatabyCategories.push(data);
    }
    this.tableloading = false;
  }

  getCategoryTypeList() {
    this.utilService.get('product/type', {}).subscribe(result => {
        if (result && result.body) {
        for(let s of result.body) {
          this.categoryTypeList.push(s);
        }
        this.getReportDatabyCategories();
      }
    });
  }

  getStorePolicy(): void {
    this.store_policy.load(()=>{
      this.batchReportStatus = this.store_policy.batch_settings.batch_report;
      this.paymentSummaryStatus = this.store_policy.batch_settings.payment_summary;
      this.emailInventoryStatus = this.store_policy.batch_settings.email_invertory;
    });
  }

  printReport() {

    const printMac = this.printers[0]?.id;

    const date = new Date(Date.now())
    const dateNow = date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate() + " " + date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds();
    let receipt = "";

    receipt += Commands.EOL;
    receipt += Commands.EOL;
    receipt += Commands.TEXT_FORMAT.TXT_ALIGN_CT;
    receipt += "Sale Summary Report";

    receipt += Commands.EOL;
    receipt += Commands.TEXT_FORMAT.TXT_NORMAL;
    receipt += Commands.TEXT_FORMAT.TXT_ALIGN_CT;
    receipt += Commands.EOL;
    receipt += dateNow;

    receipt += Commands.EOL;
    receipt += Commands.EOL;
    receipt += Commands.TEXT_FORMAT.TXT_NORMAL;
    receipt += Commands.HORIZONTAL_LINE.HR_58MM;

    this.reportDatabyCategories.forEach((p) => {
      receipt += Commands.EOL;
      receipt += Commands.TEXT_FORMAT.TXT_NORMAL;
      receipt += Commands.TEXT_FORMAT.TXT_ALIGN_LT;
      receipt += "Category name: ";
      receipt += p.name;
      receipt += Commands.EOL;
      receipt += Commands.TEXT_FORMAT.TXT_NORMAL;
      receipt += Commands.TEXT_FORMAT.TXT_ALIGN_LT;
      receipt += "Sale Quantity: ";
      receipt += p.sale_qty;
      if(!this.paymentSummaryStatus) {
        receipt += Commands.EOL;
        receipt += Commands.TEXT_FORMAT.TXT_NORMAL;
        receipt += Commands.TEXT_FORMAT.TXT_ALIGN_LT;
        receipt += "Sale Sum: ";
        receipt += p.sale_sum;  
      }
      receipt += Commands.EOL;      
    });

    receipt += Commands.TEXT_FORMAT.TXT_NORMAL;
    receipt += Commands.HORIZONTAL_LINE.HR_58MM;

    console.log(receipt);
    this.print.sendToBluetoothPrinter(printMac, receipt);
  }

  emailToCustomer(email): void{
    const discount_symbol = { percent: '%', amount: '$' };
    const data = {};
    const total: number = 0;
    const date = new Date(Date.now())
    const dateNow = date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate() + " " + date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds();
    
    let template: any = "";
    template += `<div style="display: block; width: 100%; padding-left: 40%;
                          font-family: Lato;
                          font-size: 24px;
                          font-style: normal;
                          font-weight: 700;
                          line-height: 29px;">
                        <div><b style="margin-bottom: 16px">Sale Summary Report</b></div>
                        <div>Date: ${dateNow}</div>
                    </div>`;
    template += `<div  style="
                      border-top: 1px solid;
                      margin-top: 10px;
                      padding-bottom: 10px;
                      padding-left: 48px;
                      border-bottom: 1px solid;
                      padding-top: 10px;
                      font-family: Lato;
                      font-size: 24px;
                      font-style: normal;
                      font-weight: 400;
                      line-height: 29px;
                      letter-spacing: 0em;
                      text-align: left;
                      ">`
    this.reportDatabyCategories.forEach((p) => {
        template += `<div  style="display: flex;
                    margin-bottom: 10px;
                    font-family: Lato;
                    font-size: 24px;
                    font-style: normal;
                    font-weight: 400;
                    line-height: 29px;
                    letter-spacing: 0em;
                    text-align: left;" >
                    <div style="display: flex; width: 50%">
                          <div>${p.sale_qty}</div>
                          <div style="margin-left: 50px;">`;
        template += `<div>${p.name}</div>`;
        template += `</div></div>`;
        template +=
            `<div style="width: 50%">
                        <div>$ ${p.sale_sum}</div>`;
        template += `</div></div>`;
    });
    template += `</div>`;

    // console.log("test:", template);

    Object.assign(data, {email, template: template});

    this.utilService.post('sell/email', data).subscribe(result => {
      console.log(result);
      //  this.cart.save(() => {
      //   this._completeSale();
      // });
    });
  }

  initTable() {
    this.getReportbyCategories();
  }

  get floatInput(): any {return this.form.get('open_value'); }
  get floatInputError(): string | void {
    if (this.floatInput.hasError('required')) { return Constants.message.requiredField; }
    if (this.floatInput.hasError('min')) { return Constants.message.invalidMinValue.replace('?', Constants.open_value.min.toString()); }
  }
}
