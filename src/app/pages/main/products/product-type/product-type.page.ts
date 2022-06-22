import { Component, OnInit } from '@angular/core';
import { PopoverController } from '@ionic/angular';
import { EditProductTypeComponent } from 'src/app/components/edit-product-type/edit-product-type.component';
import { SearchKeywordComponent } from 'src/app/components/search-keyword/search-keyword.component';
import { Constants } from 'src/app/_configs/constants';
import { AlertService } from 'src/app/_services/alert.service';
import { AuthService } from 'src/app/_services/auth.service';
import { ToastService } from 'src/app/_services/toast.service';
import { UtilService } from 'src/app/_services/util.service';

@Component({
  selector: 'app-product-type',
  templateUrl: './product-type.page.html',
  styleUrls: ['./product-type.page.scss'],
})
export class ProductTypePage implements OnInit {

  title:string = 'Product Types';
  allData = [];
  tableData = [];
  loading: boolean = false;
  permission:boolean = false;
  user: any;

  filter = {
    keyword: '',    
    sort_field: 'name',
    sort_order: 'asc'
  }
  rows:any[];
  all_columns:any[] = [
    {prop: 'name', name: 'Name', sortable: true, checked: true},
    {prop: 'slug', name: 'Slug', sortable: true, checked: true},
    {prop: 'touch', name: 'Touch', sortable: true, checked: true},
    {prop: 'cigarette', name: 'Cigarette', sortable: true, checked: true},
    {prop: 'revenue', name: 'Not Revenue', sortable: true, checked: true},
    {prop: 'description', name: 'Description', sortable: true, checked: true}
  ];
  show_columns:any[] = [1,3,4,5];

  constructor(
    private authService: AuthService,
    private utilService: UtilService,
    private alertService: AlertService,
    private toastService: ToastService,
    private popoverController: PopoverController
  ) {
    this.authService.currentUser.subscribe(user => {
      this.user = user;
      if(this.user.role) {
        this.permission = this.user.role.permissions.includes('create_product_type');
      }
    });
  }

  ngOnInit() {
    this.search();
  }

  initTable() {
    this.utilService.get('product/type', {}).subscribe(result => {
      this.allData = result.body;
      this.getTableData();
    });
  }

  search() {
    this.loading = true;
    if(this.allData.length == 0) {      
      this.initTable()      
    } else {
      this.getTableData();
    }    
  }

  getTableData() {
    this.rows = [];
    for(let a of this.allData) {
      let c = true;
      if(this.filter.keyword) {
        let keyword = this.filter.keyword;
        c = c && (a.name && a.name.toLowerCase().indexOf(keyword.toLowerCase().trim())>-1 || 
          a.description && a.description.toLowerCase().indexOf(keyword.toLowerCase().trim())>-1);
      }
      if(!c) continue;
      this.rows.push({
        _id: a._id,
        name: a.name,
        slug: a.slug,
        description: a.description,        
        touch: a.touch ? '<i class="far fa-check-circle fa-lg success"></i>':'<i class="far fa-times-circle fa-lg danger"></i>',
        cigarette: a.cigarette ? '<i class="far fa-check-circle fa-lg success"></i>':'<i class="far fa-times-circle fa-lg danger"></i>',
        revenue: a.revenue ? '<i class="far fa-check-circle fa-lg success"></i>':'<i class="far fa-times-circle fa-lg danger"></i>',
        touchable: a.touch,
        cigaretteable: a.cigarette,
        revenueable: a.revenue,
        products: a.products,
        property: 'type'
      })
    }
    this.loading = false;
  }

  addNew() {
    this.openEdit({
      _id: '',
      name: '',
      slug: '',
      description: '',
      touch: false,
      cigarette: false,
      revenue: false,
      private_web_address: this.user.private_web_address
    })
  }

  edit(row:any) {
    this.openEdit(row);
  }

  async openEdit(row) {
    const popover = await this.popoverController.create({
      component: EditProductTypeComponent,
      //event: ev,
      cssClass: 'popover_custom fixed-width',      
      translucent: true,
      componentProps: {row: row}
    });
    popover.onDidDismiss().then(result => {
      console.log(result);
      if(result && result.data && result.data.process) {
        this.initTable();
      }
    })
    await popover.present(); 
  }

  delete(row:any) {
    this.alertService.presentAlertConfirm('Confirm Delete?', 'Are you sure to want to delete this type?', () => {
      this.utilService.delete('product/type?_id=' + row._id).subscribe(result => {
        this.initTable();
      }, async error => {
        this.toastService.show(Constants.message.failedRemove)
      })
    })
  }

  async openSearch() {
    const popover = await this.popoverController.create({
      component: SearchKeywordComponent,
      // event: ev,
      cssClass: 'popover_custom',      
      translucent: true,
      componentProps: {keyword: this.filter.keyword, title: 'Product Type', label: 'Name / Description'}
    });

    popover.onDidDismiss().then(result => {      
      if(typeof result.data != 'undefined') {        
        let data = result.data;
        if(data.process && data.filter) {
          for(let key in data.filter) {
            this.filter[key] = data.filter[key];
          }
          this.search();
        }
      }
    });

    await popover.present(); 
  }
}
