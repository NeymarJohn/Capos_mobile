import { Component } from '@angular/core';
import { AuthService } from './_services/auth.service';
import { DbService } from './_services/db.service';
import { UtilService } from './_services/util.service';
import { StorePolicy }      from 'src/app/_classes/store_policy.class';
import { Platform } from '@ionic/angular';
import { BackgroundMode } from '@awesome-cordova-plugins/background-mode/ngx';
import { OpenRegisterService } from 'src/app/_services/open-register.service';
import { OpenRegisterPage } from 'src/app/pages/main/sell/open-register/open-register.page';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
})
export class AppComponent {
  appPages = [];  
  cur_item: string = '';
  login_status: boolean = false;

  timer_object: number = -1;
  wait_time: number = 60000; // 1 minute

  // store policy
  autoBatchCloseStatus: boolean = false;

  constructor(
    public store_policy: StorePolicy,
    public open_register: OpenRegisterPage,
    private authService: AuthService,
    private utilService: UtilService,
    public openRegisterService: OpenRegisterService, 
    private backgroundMode: BackgroundMode,
    private plt: Platform,
  ) {
    this.utilService.isOnline = navigator.onLine;    
    this.appPages = this.authService.main_menu;
    
    window.addEventListener('offline', () => {
      //Do task when no internet connection
      console.log('offline');
      this.utilService.isOnline = false;
    });
    window.addEventListener('online', () => {
      //Do task when internet connection returns
      console.log('online');
      this.utilService.isOnline = true;
    });

  }

  ngOnInit() {
    this.backgroundMode.enable();
    this.runBackgroundMode();
  }

  get isLoggedIn():boolean {
    if(this.login_status != this.authService.isLoggedIn) {
      this.login_status = this.authService.isLoggedIn;
      this.getMenu();
    }
    return this.authService.isLoggedIn;
  }

  getMenu() {
    this.appPages = this.authService.main_menu;    
  }

  private runBackgroundMode() {
    this.plt.ready().then(()=>{
      console.log('run background mode...');
      setInterval(()=>{
        this.getStorePolicy();
        this.startCheckTime();
      }, 60000);
    });
  }

  startCheckTime() {
    console.log('timer is starting...');
    if(this.autoBatchCloseStatus) {
      let now_date = new Date();
      let current_hour = now_date.getHours();
      let current_minute = now_date.getMinutes();
      if(current_hour == 4 && current_minute == 0) {
        this.openRegisterService.closeRegister();
      }
    }
  }

  getStorePolicy(): void {
    this.store_policy.load(()=>{
      this.autoBatchCloseStatus = this.store_policy.batch_settings.auto_batch_close;
    });
  }
}