import { Direction, Directionality } from '@angular/cdk/bidi';
import { EventEmitter, Injectable, OnDestroy, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class AppDirectionality implements Directionality, OnDestroy {
  readonly change = new EventEmitter<Direction>();
  readonly valueSignal = signal<Direction>('ltr');

  get value(): Direction {
    return this._value;
  }
  set value(value: Direction) {
    this._value = value;
    this.valueSignal.set(value);
    this.change.next(value);
  }
  private _value: Direction = 'ltr';

  ngOnDestroy() {
    this.change.complete();
  }
}
