import { Component } from '@angular/core';
import { AuthService } from './_services/auth.service';
import { DbService } from './_services/db.service';
import { UtilService } from './_services/util.service';

import { AlertService } from 'src/app/_services/alert.service';
import { OpenRegisterService } from 'src/app/_services/open-register.service';
import { BackgroundSetting } from './_configs/constants';
import { Platform } from '@ionic/angular';
import { BackgroundMode } from '@ionic-native/background-mode/ngx';
import { StorePolicy }      from 'src/app/_classes/store_policy.class';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
})
export class AppComponent {
  appPages = [];  
  cur_item: string = '';
  login_status: boolean = false;

  timerObject: any;

  autoBatchCloseStatus: boolean = false;

  constructor(
    private authService: AuthService,
    private utilService: UtilService,
    private backgroundMode: BackgroundMode,
    private platform: Platform,
    private alertService: AlertService,
    public store_policy: StorePolicy,
    public openRegisterService: OpenRegisterService,
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

  getStorePolicy(): void {
    this.store_policy.load(()=>{
      this.autoBatchCloseStatus = this.store_policy.batch_settings.auto_batch_close;
    });
  }

  private runBackgroundMode() {
    this.platform.ready().then(() => {
      console.log('run background mode...');
      setInterval(() => {
        this.getStorePolicy();
        this.startCheckTime();
      }, BackgroundSetting._waitTime);
    });
    
  }

  startCheckTime() {
    console.log("Timer is started");

    if(this.autoBatchCloseStatus) {
      let now_date = new Date();
      let current_hour = now_date.getHours();
      let current_minute = now_date.getMinutes();

      if(current_hour == 4 && current_minute == 0) {
        // close register in open/close register panel
        this.openRegisterService.closeRegister();
      }
    }
    // if(!this.autoBatchCloseStatus && this.backgroundMode.isEnabled()) {
    //   // stop timing
    //   this.stopcheckTime();
    //   this.backgroundMode.disable();
    // } else if(this.autoBatchCloseStatus && !this.backgroundMode.isEnabled()) {
    //   // start timing
    //   this.timerObject = setInterval(()=>{
    //     this.startCheckTime();
    //   }, BackgroundSetting._waitTime);
    //   this.backgroundMode.enable();
    // } else {
      
    // }
  }
}
