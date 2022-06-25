
import { Injectable } from '@angular/core';
import * as UtilFunc      from 'src/app/_helpers/util.helper';
import { Constants, Commands } from 'src/app/_configs/constants';
import { AuthService } from './auth.service';
import { UtilService } from './util.service';
import { CartService } from './cart.service';
import { PrintService }   from 'src/app/services/print.service';
import { Openclose } from '../_classes/openclose.class';
import { Producttype } from '../_classes/producttype.class';
import { StorePolicy } from '../_classes/store_policy.class';
import { AlertService } from './alert.service';

@Injectable({
  providedIn: 'root'
})

export class OpenRegisterService {

	// openClose: Openclose;
 	// lastClose: Openclose;
 	util = UtilFunc;
 	tableData: any = [];
 	categories:Producttype[] = [];
 	allData:any = [];
  outlet:any = [];
  salestax:any = [];


 	printers: any[] = [];

	// store policy setting
	batchReportStatus: boolean = false;
	paymentSummaryStatus: boolean = false;
	emailInventoryStatus: boolean = false;
	cigaretteSummaryStatus: boolean = false;
	notRevenueStatus: boolean = false; 
	salesPersonStatus: boolean = false;

	constructor(
		public cartService: CartService,
		public store_policy:StorePolicy,
		private alertService: AlertService,
		private utilService: UtilService,
		private authService: AuthService,
		private print: PrintService,
	) {
		// this.init();
		// this.addPrinterList();
	}

	ngOnInit() {
		this.init();
		this.addPrinterList();
	}

	init() {
		this.tableData = [];
		this.loadOutlet();
    	this.loadSalesTax();
		this.loadCategories();
		this.loadStorePolicy();
	}

	addPrinterList(): void {
		this.print.searchBluetoothPrinter()
		  .then( resp => {
		    this.printers = resp;
		  })
	}

	loadCategories() {
		this.categories = [];
		let filter:any = [];
		filter.touch = true;
		if(this.cigaretteSummaryStatus){
			filter.cigarette = false;
		}
		if(this.notRevenueStatus) {
			// filter.revenue = false;
		}
		this.utilService.get('product/type', filter).subscribe(result => {
		  if(result && result.body) {
		    for(let t of result.body) {
		      let type = new Producttype(this.authService, this.utilService);
		      type.loadDetails(t);
		      this.categories.push(type);
		    }
		  }      
		});
	}

	loadStorePolicy() {
		this.store_policy.load(()=>{
		  this.batchReportStatus = this.store_policy.batch_settings.batch_report;
		  this.paymentSummaryStatus = this.store_policy.batch_settings.payment_summary;
		  this.emailInventoryStatus = this.store_policy.batch_settings.email_invertory;
		  this.cigaretteSummaryStatus = this.store_policy.batch_settings.cigarette_summary;
		  this.notRevenueStatus = this.store_policy.batch_settings.not_revenue;
		  this.salesPersonStatus = this.store_policy.batch_settings.sales_person;
		});
	}

	loadOutlet() {
    this.outlet = [];
    this.utilService.get('sell/outlet').subscribe(result => {
      if(result) {
        for(let l of result.body) {
          this.outlet.push(l);
        }
      }
    })
  }

  loadSalesTax() {
    this.salestax = [];
    this.utilService.get('sale/salestax').subscribe(result => {
      if(result && result.body) {
        for(let s of result.body) {
          this.salestax.push(s);
        }
      }
    })
  }

	public get openClose():Openclose {
		return this.cartService.openClose;
	}

	public get lastClose():Openclose {
		return this.cartService.lastClose;
	}

	public closeRegister() {
		if(this.cartService.openClose._id) {
	      this.cartService.getOpenClose();
				this.cartService.closeRegister();
				this.printReport();
	    }
	}

	public getTableData(callback?:Function):any {
		// this.loadCategories();
		this.loadTableData(callback);
	}

	async loadTableData(callback?:Function) {
		this.tableData = [];
		let filter = {      
	      start: '',
	      user_id: '',
	      end: '',
	    };

		if (this.cartService.openClose._id) {
	      filter.start = this.openClose.opening_time;
	      filter.user_id = this.openClose.user._id;
	    } else {
	      return;
	    }

	    await this.utilService.get('sale/sale', filter).subscribe(result => {
	      const data = result.body;
	      if (result && result.body) {
	        this.allData = [];
	        for(let s of result.body) {
	          for(let p of s.products) {
	            // let index = this.categories.findIndex(item=>item == p.product_id.type);
	            // if (index == -1) this.categories.push(p.product_id.type);
	            this.allData.push(p);
	          }
	        }

	        for(let c of this.categories) {
		      let cData = this.allData.filter(item => item.product_id.type == c._id);
		      if (cData.length > 0) {
		        let totalQty = cData.reduce((a, b)=>a + b.qty, 0);
		        
		        let tax_rate = 0;            
            let lData = this.outlet.filter(item => item._id == cData[0].product_id.outlet);
            if(lData.length > 0) {
              let sData = this.salestax.filter(item => item._id == lData[0].defaultTax._id);
              if(sData.length > 0) {
                tax_rate = sData[0].rate;
              }
            }

		        let price = cData[0].price + (cData[0].price * tax_rate / 100);
            let totalPrice = totalQty * price;
		        let data = {
		          name: c.data.name,
		          sale_qty: totalQty,
		          sale_sum:this.util.getPriceWithCurrency(totalPrice)
		        };
		        this.tableData.push(data);
		      } else {
		        let catname = this.categories.filter(item => item._id == c._id);
		        let data = {
		          name: c.data.name,
		          sale_qty: 0,
		          sale_sum: 0
		        };
		        this.tableData.push(data);
		      }
		    }
		    if(callback) callback();
	      }	      
	    });
	}

	printReport() {
		if(!this.batchReportStatus) {
			this.printTableData();
		}
		if(this.cartService.cart.customer && this.emailInventoryStatus) {
			this.emailToCustomer(this.cartService.cart.customer.data.email);	
		}		
	}

	printTableData() {
		const printMac = this.printers[0]?.id;
		// console.log(printMac);
		
		const date = new Date(Date.now())
		const dateNow = date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate() + " " + date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds();
		let receipt = "";

		receipt += Commands.EOL;
		receipt += Commands.TEXT_FORMAT.TXT_NORMAL;
		receipt += Commands.TEXT_FORMAT.TXT_ALIGN_CT;
		receipt += "Report Summary";
		receipt += Commands.EOL;
		receipt += Commands.TEXT_FORMAT.TXT_ALIGN_CT;
		receipt += dateNow;
		receipt += Commands.EOL;		
		receipt += Commands.EOL;		
		receipt += "Payments Summary";
		receipt += Commands.EOL;
		receipt += Commands.TEXT_FORMAT.TXT_NORMAL;
		receipt += Commands.HORIZONTAL_LINE.HR_58MM;
		receipt += Commands.EOL;
		receipt += Commands.TEXT_FORMAT.TXT_ALIGN_LT;
		receipt += "Payment Type";
		receipt += Commands.TEXT_FORMAT.TXT_ALIGN_RT;
		receipt += "Expected";
		receipt += Commands.EOL;
		receipt += Commands.TEXT_FORMAT.TXT_ALIGN_LT;
		receipt += "Cash";
		receipt += Commands.TEXT_FORMAT.TXT_ALIGN_RT;
		receipt += this.util.getPriceWithCurrency(this.openClose.expectedCash);
		receipt += Commands.EOL;
		receipt += Commands.TEXT_FORMAT.TXT_ALIGN_LT;
		receipt += "Credit Card";
		receipt += Commands.TEXT_FORMAT.TXT_ALIGN_RT;
		receipt += this.util.getPriceWithCurrency(this.openClose.diffCreditCard);
		receipt += Commands.EOL;
		receipt += Commands.TEXT_FORMAT.TXT_ALIGN_LT;
		receipt += "Debit Card";
		receipt += Commands.TEXT_FORMAT.TXT_ALIGN_RT;
		receipt += this.util.getPriceWithCurrency(this.openClose.receivedDebitCard);
		receipt += Commands.EOL;
		receipt += Commands.TEXT_FORMAT.TXT_ALIGN_LT;
		receipt += "Store Credit";
		receipt += Commands.TEXT_FORMAT.TXT_ALIGN_RT;
		receipt += this.util.getPriceWithCurrency(this.openClose.receivedStoreCredit);
		receipt += Commands.EOL;
		receipt += Commands.TEXT_FORMAT.TXT_ALIGN_LT;
		receipt += "Refunds";
		receipt += Commands.TEXT_FORMAT.TXT_ALIGN_RT;
		receipt += this.util.getPriceWithCurrency(this.openClose.totalReturns);
		receipt += Commands.EOL;
		receipt += Commands.TEXT_FORMAT.TXT_ALIGN_LT;
		receipt += "Voided";
		receipt += Commands.TEXT_FORMAT.TXT_ALIGN_RT;
		receipt += this.util.getPriceWithCurrency(this.openClose.totalVoided);
		receipt += Commands.EOL;
		receipt += Commands.EOL;
		receipt += Commands.TEXT_FORMAT.TXT_ALIGN_LT;
		receipt += "Total";
		receipt += Commands.TEXT_FORMAT.TXT_ALIGN_RT;
		receipt += this.util.getPriceWithCurrency(this.openClose.totalCounted);
		receipt += Commands.EOL;
		receipt += Commands.TEXT_FORMAT.TXT_NORMAL;
		receipt += Commands.HORIZONTAL_LINE.HR_58MM;
		receipt += Commands.EOL;

		receipt += Commands.TEXT_FORMAT.TXT_NORMAL;
		receipt += Commands.TEXT_FORMAT.TXT_ALIGN_LT;
		receipt += "Sale Summary";
		receipt += Commands.EOL;
		receipt += Commands.TEXT_FORMAT.TXT_NORMAL;
		receipt += Commands.HORIZONTAL_LINE.HR_58MM;
		receipt += Commands.EOL;
		receipt += Commands.TEXT_FORMAT.TXT_NORMAL;
		receipt += Commands.TEXT_FORMAT.TXT_ALIGN_LT;
		receipt += "Category";
		if(!this.paymentSummaryStatus) {
			receipt += Commands.TEXT_FORMAT.TXT_ALIGN_LT;
			receipt += "Qty";
			receipt += Commands.TEXT_FORMAT.TXT_ALIGN_RT;
			receipt += "Sum";
		} else {
			receipt += Commands.TEXT_FORMAT.TXT_ALIGN_RT;
			receipt += "Sum";
		}
		
		this.tableData.forEach((p) => {
		  receipt += Commands.EOL;
		  receipt += Commands.TEXT_FORMAT.TXT_NORMAL;
		  receipt += Commands.TEXT_FORMAT.TXT_ALIGN_LT;
		//   receipt += "Category name: ";
		  receipt += p.name;
		//   receipt += Commands.EOL;
		  if (!this.paymentSummaryStatus) {
			receipt += Commands.TEXT_FORMAT.TXT_ALIGN_LT;
			// receipt += "Sale Quantity: ";
			receipt += p.sale_qty;
			receipt += Commands.TEXT_FORMAT.TXT_ALIGN_RT;
			receipt += p.sale_sum;
		  } else {
			receipt += Commands.TEXT_FORMAT.TXT_ALIGN_RT;
			receipt += p.sale_sum;
		  }
		});
		receipt += Commands.TEXT_FORMAT.TXT_NORMAL;
		receipt += Commands.HORIZONTAL_LINE.HR_58MM;
		receipt += Commands.EOL;
		receipt += Commands.EOL;

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
	    this.tableData.forEach((p) => {
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
	      // console.log(result);
	      //  this.cart.save(() => {
	      //   this._completeSale();
	      // });
	    });
	  }

}