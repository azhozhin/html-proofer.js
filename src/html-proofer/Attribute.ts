import {IRunner} from '../interfaces/'

export class Attribute {
  protected runner: IRunner
  public raw_attribute: string | null;

  constructor(runner: IRunner, raw_attribute: string | null) {
    this.runner = runner
    this.raw_attribute = raw_attribute
  }
}
