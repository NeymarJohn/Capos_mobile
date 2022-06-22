import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { PopoverController } from '@ionic/angular';
import { AuthService } from 'src/app/_services/auth.service';
import { UtilService } from 'src/app/_services/util.service';
import { Constants } from 'src/app/_configs/constants';
import { LoadingService } from 'src/app/_services/loading.service';
import { ToastService } from 'src/app/_services/toast.service';

@Component({
  selector: 'app-drawer-note',
  templateUrl: './drawer-note.component.html',
  styleUrls: ['./drawer-note.component.scss'],
})
export class DrawerNoteComponent implements OnInit {
  title: string = 'Add New Cash';
  form: FormGroup;
  main_outlet: any;
  user: any;
  cash: any;
  data: any;
  isSubmitted: boolean = false;

  constructor(
    private popoverController: PopoverController,
    private utilService: UtilService,
    private toastService: ToastService,
    private fb: FormBuilder,
    private loading: LoadingService
  ) {
    this.form = this.fb.group({
      reasons: ['', [Validators.required]],
      transaction: ['', [Validators.required, Validators.min(1)]],
      is_credit: ['0'],
    });
  }

  ngOnInit() {
  }

  doAction(){
    this.isSubmitted = true;
    if(this.form.valid){
      let note = this.form.get('note').value;
      let amount = this.form.get('amount').value;
      this.popoverController.dismiss({process: true, reason: note, amount: amount});
    }
  }

  async submit() {
    this.isSubmitted = true;
    if(this.form.invalid) return;
    await this.loading.create();
    const data = this.form.value;
    if(!data.rate) data.rate = 0;
    data.private_web_address = this.user.private_web_address;
    data.outlet = this.user.outlet ? this.user.outlet._id : this.main_outlet._id;
    data.user_id = this.user._id;
    data.register = this.user.outlet ? this.user.outlet.register[0] : this.main_outlet.registers[0];
    this.utilService.post('sell/cash', data).subscribe(async result => {
      await this.final_process(result);
    });
  }

  async final_process(result) {
    await this.loading.dismiss();
    this.toastService.show(Constants.message.successSaved);
    this.popoverController.dismiss({process: true});
  }

  dismiss() {
    this.popoverController.dismiss();
  }

  // get noteInput(): any {return this.form.get('note'); }
  // get noteInputError(): string {
  //   if (this.noteInput.hasError('required')) {return 'This field is required'; }
  // }
  // get amountInput(): any {return this.form.get('amount'); }
  // get amountInputError(): string {
  //   if (this.amountInput.hasError('required')) {return 'This field is required'; }
  // }

  get reasonsInput(): any {return this.form.get('reasons'); }
  get reasonsInputError(): string {
    if (this.reasonsInput.hasError('required')) {return Constants.message.requiredField; }
  }

  get transactionInput(): any {return this.form.get('transaction'); }
  get transactionInputError(): string {
    if (this.transactionInput.hasError('required')) {return Constants.message.requiredField; }
    if (this.transactionInput.hasError('min')) {return Constants.message.invalidMinValue.replace('?', Constants.cash_transaction.min.toString()); }
  }

}
