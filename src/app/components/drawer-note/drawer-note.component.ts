import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { PopoverController } from '@ionic/angular';

@Component({
  selector: 'app-drawer-note',
  templateUrl: './drawer-note.component.html',
  styleUrls: ['./drawer-note.component.scss'],
})
export class DrawerNoteComponent implements OnInit {
  form: FormGroup;
  isSubmitted: boolean = false;
  data:any;

  constructor(
    private fb: FormBuilder,
    private popoverController: PopoverController
  ) {
    this.form = this.fb.group({
      note:['', Validators.required],
      amount:['', Validators.required],
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

  dismiss() {
    this.popoverController.dismiss();
  }

  get noteInput(): any {return this.form.get('note'); }
  get noteInputError(): string {
    if (this.noteInput.hasError('required')) {return 'This field is required'; }
  }
  get amountInput(): any {return this.form.get('amount'); }
  get amountInputError(): string {
    if (this.amountInput.hasError('required')) {return 'This field is required'; }
  }

}
