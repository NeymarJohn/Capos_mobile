import { Component, OnInit }                  from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NavController, PopoverController } from '@ionic/angular';

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
import { OpenRegisterService } from 'src/app/_services/open-register.service';
import { PrintService }   from 'src/app/services/print.service';
import { CashDetailComponent } from 'src/app/components/cash-detail/cash-detail.component';


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

  categories = [];
  allData:any = [];
  tableData = [];

  all_columns:any[] = [
    {prop: 'name', name: 'Category Name', sortable: true, checked: true},
    {prop: 'sale_qty', name: 'SaleQty', sortable: true, checked: true},
    {prop: 'sale_sum', name: 'SaleSum', sortable: true, checked: true}
  ];
  show_columns:any[] = [1, 2, 3];
  tableloading: boolean = false;
  

  printers: any[] = [];

  constructor(
    private authService: AuthService,
    private utilService: UtilService,
    private loading: LoadingService,
    private toastService: ToastService,
    private nav: NavController,
    private popoverController: PopoverController,
    private alertService: AlertService,
    public cartService: CartService,
    public openRegisterService: OpenRegisterService,
    private fb: FormBuilder,
    // public openClose: Openclose,
    // public lastClose: Openclose,
    private print: PrintService,
    public store_policy:StorePolicy,
  ) {
    this.authService.checkPremission('close_register');
    this.form = this.fb.group({
      open_value: ['', [Validators.required, Validators.min(1)]],
      open_note: ['']
    });
    this.addPrinterList();
    
  }

  ngOnInit() {
    console.log('ngOnInit');
    if('close'.includes(this.mode)) {
      this.cartService.getOpenClose();
    } else {
      this.cartService.getLastClose();
    }
    this.openRegisterService.init();
  }

  ionViewDidEnter() {
    console.log('ionViewDidEnter');
    this.getReportbyCategories();
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
          this.initTable();
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

  public closeRegister(flag: boolean){

    if(this.mode === "open") {
      console.log("register must open to close register and print on the report");
      return;
    }
    
    if(flag) {

      let title = 'Close Register';
      let msg = 'Are you sure to want to close this register?';
      this.alertService.presentAlertConfirm(title, msg, () => {
        // this.cartService.closeRegister(() => {
        //   this.toastService.show('Register Closed successfully.');
        // })
      });

      this.openRegisterService.printReport();

      // if (!this.batchReportStatus){
      //   this.openRegisterService.printTableData();
      // }
      // if(this.cartService.cart.customer && this.emailInventoryStatus) {
      //   this.openRegisterService.emailToCustomer(this.cartService.cart.customer.data.email);
      // }
    } else {
        // if (!this.batchReportStatus){
        //   this.printReport();
        // }
        // this.cartService.closeRegister(() => {
        //   this.toastService.show('Register Closed successfully.');
        // })
    }
  }

  async getReportbyCategories() {
    this.tableData = [];
    this.openRegisterService.getTableData(()=>{
      this.tableData = this.openRegisterService.tableData;
    });
  }

  printReport() {
    this.openRegisterService.printReport();
  }

  

  public initTable() {
    console.log('initTable');
    this.getReportbyCategories();
  }

  get floatInput(): any {return this.form.get('open_value'); }
  get floatInputError(): string | void {
    if (this.floatInput.hasError('required')) { return Constants.message.requiredField; }
    if (this.floatInput.hasError('min')) { return Constants.message.invalidMinValue.replace('?', Constants.open_value.min.toString()); }
  }
}
